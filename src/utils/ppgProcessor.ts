
import { VitalReading, PPGData, SensitivitySettings, ProcessingSettings } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';
import { SignalExtractor } from './signalExtraction';
import { PeakDetector } from './peakDetection';
import { SignalNormalizer } from './signalNormalization';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';
import { MLModel } from './mlModel';
import { validateVitalSigns, validateSignalQuality } from './ppgValidation';

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
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1.5,
    noiseReduction: 1.2,
    peakDetection: 1.3,
    heartbeatThreshold: 0.5,
    responseTime: 1.0,
    signalStability: 0.5,
    brightness: 1.0,
    redIntensity: 1.0
  };
  
  private processingSettings: ProcessingSettings = {
    MEASUREMENT_DURATION: 30,
    MIN_FRAMES_FOR_CALCULATION: 15,
    MIN_PEAKS_FOR_VALID_HR: 2,
    MIN_PEAK_DISTANCE: 400,
    MAX_PEAK_DISTANCE: 1200,
    PEAK_THRESHOLD_FACTOR: 0.4,
    MIN_RED_VALUE: 15,
    MIN_RED_DOMINANCE: 1.2,
    MIN_VALID_PIXELS_RATIO: 0.2,
    MIN_BRIGHTNESS: 80,
    MIN_VALID_READINGS: 30,
    FINGER_DETECTION_DELAY: 500,
    MIN_SPO2: 75
  };
  
  constructor() {
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
    const now = Date.now();
    
    const { red, ir, quality } = this.signalExtractor.extractChannels(imageData);
    
    console.log('Estado del sensor:', {
      detectandoDedo: red > this.processingSettings.MIN_RED_VALUE,
      valorRojo: red.toFixed(2),
      umbralMinimo: this.processingSettings.MIN_RED_VALUE,
      calidadSenal: (quality * 100).toFixed(1) + '%'
    });
    
    if (!validateSignalQuality(quality, red, this.qualityThreshold, this.processingSettings.MIN_RED_VALUE)) {
      console.log('❌ No se detecta dedo o señal de baja calidad:', { 
        red: red.toFixed(2), 
        calidad: (quality * 100).toFixed(1) + '%',
        umbralCalidad: (this.qualityThreshold * 100).toFixed(1) + '%',
        umbralRojo: this.processingSettings.MIN_RED_VALUE
      });
      this.resetBuffers();
      return this.getEmptyReading();
    }
    
    const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
    const amplifiedIr = ir * this.sensitivitySettings.signalAmplification;
    
    this.updateBuffers(amplifiedRed, amplifiedIr);
    
    const filteredRed = this.signalFilter.lowPassFilter(this.redBuffer, 
      5 * this.sensitivitySettings.noiseReduction);
    const normalizedValue = this.signalNormalizer.normalizeSignal(
      filteredRed[filteredRed.length - 1]
    );
    
    this.readings.push({ timestamp: now, value: normalizedValue });
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }

    const isPeak = await this.processPeak(normalizedValue, now);
    const vitalSigns = await this.calculateVitalSigns(filteredRed, isPeak);
    
    if (this.frameCount % 30 === 0 && vitalSigns.bpm > 0) {
      await this.updateMLModel(vitalSigns);
    }

    return {
      ...vitalSigns,
      readings: this.readings,
      isPeak
    };
  }

  private resetBuffers(): void {
    this.redBuffer = [];
    this.irBuffer = [];
    this.readings = [];
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

  private updateBuffers(amplifiedRed: number, amplifiedIr: number): void {
    this.redBuffer.push(amplifiedRed);
    this.irBuffer.push(amplifiedIr);
    
    if (this.redBuffer.length > this.windowSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
  }

  private async processPeak(normalizedValue: number, now: number): Promise<boolean> {
    const isPeak = this.peakDetector.isRealPeak(normalizedValue, now, this.redBuffer.slice(-this.bufferSize));
    
    if (isPeak) {
      try {
        await this.beepPlayer.playBeep('heartbeat', 5.0);
        console.log('🫀 Pico detectado + Beep reproducido:', {
          tiempo: now,
          valorPico: normalizedValue
        });
      } catch (err) {
        console.error('Error al reproducir beep:', err);
      }
    }

    return isPeak;
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

    this.lastValidBpm = validatedVitals.bpm;
    this.lastValidSystolic = validatedVitals.systolic;
    this.lastValidDiastolic = validatedVitals.diastolic;

    const hrvAnalysis = this.signalProcessor.analyzeHRV([]);

    return {
      ...validatedVitals,
      spo2: Math.min(100, Math.max(75, spo2Result.spo2)),
      hasArrhythmia: hrvAnalysis.hasArrhythmia,
      arrhythmiaType: hrvAnalysis.type,
      signalQuality,
      confidence: spo2Result.confidence,
      hrvMetrics: hrvAnalysis
    };
  }

  private async updateMLModel(vitalSigns: { bpm: number, spo2: number }): Promise<void> {
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

  getReadings(): VitalReading[] {
    return this.readings;
  }

  updateSensitivitySettings(settings: SensitivitySettings): void {
    this.sensitivitySettings = settings;
    console.log('Sensitivity settings updated:', settings);
  }
}
