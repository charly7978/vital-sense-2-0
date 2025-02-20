import { VitalReading, PPGData } from '@/types/vitals';
import { SensitivitySettings, ProcessingSettings } from '@/types/settings';
import { BeepPlayer } from '@/utils/audio/BeepPlayer';
import { SignalProcessor } from './processors/SignalProcessor';
import { SignalExtractor } from './processors/SignalExtractor';
import { PeakDetector } from './processors/PeakDetector';
import { SignalNormalizer } from './processors/SignalNormalizer';
import { SignalFilter } from './processors/SignalFilter';
import { SignalFrequencyAnalyzer } from './processors/SignalFrequencyAnalyzer';
import { MLModel } from './ml/MLModel';
import { validateVitalSigns, validateSignalQuality } from './validation/ppgValidation';
import { defaultProcessingSettings } from './config/processingSettings';
import { defaultSensitivitySettings } from './config/sensitivitySettings';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private readonly samplingRate = 30;
  private readonly windowSize = 300;
  private readonly bufferSize = 30;
  private readonly qualityThreshold = 0.2;
  
  private lastValidBpm: number = 0;
  private lastValidSystolic: number = 120;
  private lastValidDiastolic: number = 80;
  private frameCount: number = 0;
  
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private readonly mlModel: MLModel;
  private readonly beepPlayer: BeepPlayer;
  
  private sensitivitySettings: SensitivitySettings;
  private processingSettings: ProcessingSettings;
  
  constructor() {
    this.sensitivitySettings = defaultSensitivitySettings;
    this.processingSettings = defaultProcessingSettings;
    
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
    this.signalExtractor = new SignalExtractor();
    this.peakDetector = new PeakDetector();
    this.signalNormalizer = new SignalNormalizer();
    this.signalFilter = new SignalFilter(this.samplingRate);
    this.frequencyAnalyzer = new SignalFrequencyAnalyzer(this.samplingRate);
    this.mlModel = new MLModel();
  }

  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    this.frameCount++;
    const { red, ir, quality } = await this.extractAndValidateSignal(imageData);
    
    if (!quality.isValid) {
      return this.getEmptyReading();
    }
    
    const processedSignals = await this.processSignals(red, ir);
    const vitalSigns = await this.calculateVitalSigns(processedSignals.filteredRed, processedSignals.isPeak);
    
    if (this.frameCount % 30 === 0 && vitalSigns.bpm > 0) {
      await this.updateMLModel(vitalSigns);
    }

    return vitalSigns;
  }

  private async extractAndValidateSignal(imageData: ImageData) {
    const { red, ir, quality } = this.signalExtractor.extractChannels(imageData);
    
    const isValid = validateSignalQuality(
      quality, 
      red, 
      this.qualityThreshold, 
      this.processingSettings.MIN_RED_VALUE
    );

    return { red, ir, quality: { value: quality, isValid } };
  }

  private getEmptyReading(): PPGData {
    return {
      bpm: 0,
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      hasArrhythmia: false,
      arrhythmiaType: 'Normal',
      signalQuality: 0,
      confidence: 0,
      readings: [],
      isPeak: false,
      hrvMetrics: {
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        lfhf: 0
      }
    };
  }

  private async processSignals(red: number, ir: number) {
    const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
    const amplifiedIr = ir * this.sensitivitySettings.signalAmplification;
    
    this.updateBuffers(amplifiedRed, amplifiedIr);
    
    const filteredRed = this.signalFilter.lowPassFilter(
      this.redBuffer,
      5 * this.sensitivitySettings.noiseReduction
    );
    
    const normalizedValue = this.signalNormalizer.normalizeSignal(
      filteredRed[filteredRed.length - 1]
    );
    
    const now = Date.now();
    this.readings.push({ timestamp: now, value: normalizedValue });
    
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }

    const isPeak = await this.peakDetector.isRealPeak(
      normalizedValue,
      now,
      this.redBuffer.slice(-this.bufferSize)
    );

    return { filteredRed, isPeak };
  }

  private async calculateVitalSigns(filteredRed: number[], isPeak: boolean): Promise<PPGData> {
    const { frequencies, magnitudes } = this.frequencyAnalyzer.performFFT(filteredRed);
    const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
    const dominantFreq = frequencies[dominantFreqIndex];
    const calculatedBpm = dominantFreq * 60;
    
    const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
    const bp = this.signalProcessor.estimateBloodPressure(filteredRed, []);
    const signalQuality = this.signalProcessor.analyzeSignalQuality(filteredRed);
    
    const validatedVitals = validateVitalSigns(
      calculatedBpm,
      bp.systolic,
      bp.diastolic,
      this.lastValidBpm,
      this.lastValidSystolic,
      this.lastValidDiastolic
    );

    const hrvAnalysis = this.signalProcessor.analyzeHRV([]);

    return {
      ...validatedVitals,
      spo2: Math.min(100, Math.max(75, spo2Result.spo2)),
      hasArrhythmia: hrvAnalysis.hasArrhythmia,
      arrhythmiaType: hrvAnalysis.type,
      signalQuality,
      confidence: spo2Result.confidence,
      readings: this.readings,
      isPeak,
      hrvMetrics: hrvAnalysis
    };
  }

  private async updateMLModel(vitalSigns: { bpm: number; spo2: number }): Promise<void> {
    try {
      const optimizedSettings = await this.mlModel.predictOptimizedSettings([
        vitalSigns.bpm,
        vitalSigns.spo2,
        this.signalProcessor.analyzeSignalQuality(this.redBuffer)
      ]);
      
      this.updateProcessingSettings(optimizedSettings);
    } catch (error) {
      console.error("Error actualizando settings con ML:", error);
    }
  }

  private updateProcessingSettings(optimizedSettings: number[]): void {
    if (this.validateOptimizedSettings(optimizedSettings)) {
      this.processingSettings.MIN_RED_VALUE = optimizedSettings[0];
      this.processingSettings.PEAK_THRESHOLD_FACTOR = optimizedSettings[1];
      this.processingSettings.MIN_VALID_PIXELS_RATIO = optimizedSettings[2];
    }
  }

  private validateOptimizedSettings(settings: number[]): boolean {
    return !settings.some(isNaN) &&
           settings[0] >= 10 && settings[0] <= 30 &&
           settings[1] >= 0.3 && settings[1] <= 0.7 &&
           settings[2] >= 0.1 && settings[2] <= 0.5;
  }

  private updateBuffers(amplifiedRed: number, amplifiedIr: number): void {
    this.redBuffer.push(amplifiedRed);
    this.irBuffer.push(amplifiedIr);
    
    if (this.redBuffer.length > this.windowSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }

  updateSensitivitySettings(settings: SensitivitySettings): void {
    this.sensitivitySettings = settings;
    console.log('Sensitivity settings updated:', settings);
  }
}
