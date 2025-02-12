import { VitalReading, PPGData, SensitivitySettings, ProcessingSettings } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';
import { SignalExtractor } from './signalExtraction';
import { PeakDetector } from './peakDetection';
import { SignalNormalizer } from './signalNormalization';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';
import { MLModel } from './mlModel';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private peakTimes: number[] = [];
  private readonly samplingRate = 30;
  private readonly windowSize = 90;
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private beepPlayer: BeepPlayer;
  private signalBuffer: number[] = [];
  private readonly bufferSize = 15;
  private readonly qualityThreshold = 0.2;
  private mlModel: MLModel;
  private lastProcessingTime: number = 0;
  private readonly minProcessingInterval = 50;
  private lastValidBpm: number = 0;
  private lastValidSystolic: number = 120;
  private lastValidDiastolic: number = 80;
  private lastCleanupTime: number = 0;
  private readonly cleanupInterval: number = 2000;
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1.5,
    noiseReduction: 1.2,
    peakDetection: 1.3
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
    console.log('Inicializando PPGProcessor...');
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
    this.signalExtractor = new SignalExtractor();
    this.peakDetector = new PeakDetector();
    this.signalNormalizer = new SignalNormalizer();
    this.signalFilter = new SignalFilter(this.samplingRate);
    this.frequencyAnalyzer = new SignalFrequencyAnalyzer(this.samplingRate);
    this.mlModel = new MLModel();
  }

  private validateVitalSigns(bpm: number, systolic: number, diastolic: number): {
    bpm: number;
    systolic: number;
    diastolic: number;
  } {
    const validBpm = bpm >= 40 && bpm <= 200 ? bpm : this.lastValidBpm || 0;
    const validSystolic = systolic >= 90 && systolic <= 180 ? systolic : this.lastValidSystolic;
    const validDiastolic = diastolic >= 60 && diastolic <= 120 ? diastolic : this.lastValidDiastolic;
    
    if (validSystolic <= validDiastolic) {
      return {
        bpm: validBpm,
        systolic: this.lastValidSystolic,
        diastolic: this.lastValidDiastolic
      };
    }

    this.lastValidBpm = validBpm;
    this.lastValidSystolic = validSystolic;
    this.lastValidDiastolic = validDiastolic;

    return {
      bpm: validBpm,
      systolic: validSystolic,
      diastolic: validDiastolic
    };
  }

  private cleanupOldData() {
    const now = Date.now();
    
    if (now - this.lastCleanupTime < this.cleanupInterval) {
      return;
    }
    
    this.lastCleanupTime = now;
    const maxAge = 10000;

    try {
      // Usar método defensivo para limpiar los arrays
      if (this.readings.length > 0) {
        const recentReadings = this.readings.filter(reading => now - reading.timestamp < maxAge);
        this.readings = recentReadings;
      }

      if (this.redBuffer.length > this.windowSize) {
        this.redBuffer = this.redBuffer.slice(-this.windowSize);
      }
      
      if (this.irBuffer.length > this.windowSize) {
        this.irBuffer = this.irBuffer.slice(-this.windowSize);
      }
      
      if (this.peakTimes.length > 5) {
        this.peakTimes = this.peakTimes.slice(-5);
      }
      
      if (this.signalBuffer.length > this.bufferSize) {
        this.signalBuffer = this.signalBuffer.slice(-this.bufferSize);
      }
    } catch (error) {
      console.error('Error durante la limpieza de datos:', error);
    }
  }

  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    const now = Date.now();
    
    try {
      if (now - this.lastProcessingTime < this.minProcessingInterval) {
        return null;
      }
      this.lastProcessingTime = now;

      const { red, ir, quality } = this.signalExtractor.extractChannels(imageData);
      
      if (quality < this.qualityThreshold || red < this.processingSettings.MIN_RED_VALUE) {
        this.cleanupOldData();
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
          redValue: red,
          hrvMetrics: {
            sdnn: 0,
            rmssd: 0,
            pnn50: 0,
            lfhf: 0
          }
        };
      }
      
      const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
      const amplifiedIr = ir * this.sensitivitySettings.signalAmplification;
      
      this.redBuffer.push(amplifiedRed);
      this.irBuffer.push(amplifiedIr);
      
      const filteredRed = this.signalFilter.lowPassFilter(this.redBuffer, 
        5 * this.sensitivitySettings.noiseReduction);
      const normalizedValue = this.signalNormalizer.normalizeSignal(
        filteredRed[filteredRed.length - 1]
      );
      
      this.readings.push({ timestamp: now, value: normalizedValue });
      this.signalBuffer.push(normalizedValue);

      this.cleanupOldData();

      const isPeak = this.peakDetector.isRealPeak(normalizedValue, now, this.signalBuffer);

      if (isPeak) {
        this.peakTimes.push(now);
        try {
          await this.beepPlayer.playBeep('heartbeat');
        } catch (error) {
          console.error('Error reproduciendo beep:', error);
        }
      }

      const { frequencies, magnitudes } = this.frequencyAnalyzer.performFFT(filteredRed);
      const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
      const dominantFreq = frequencies[dominantFreqIndex];
      const calculatedBpm = dominantFreq * 60;
      
      const intervals = [];
      for (let i = 1; i < this.peakTimes.length; i++) {
        intervals.push(this.peakTimes[i] - this.peakTimes[i-1]);
      }
      
      const hrvAnalysis = this.signalProcessor.analyzeHRV(intervals);
      const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
      
      // Esperar la resolución de la promesa de estimateBloodPressure
      const bp = await this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);
      const validatedVitals = this.validateVitalSigns(calculatedBpm, bp.systolic, bp.diastolic);

      return {
        bpm: validatedVitals.bpm,
        spo2: Math.min(100, Math.max(75, spo2Result.spo2)),
        systolic: validatedVitals.systolic,
        diastolic: validatedVitals.diastolic,
        hasArrhythmia: hrvAnalysis.hasArrhythmia,
        arrhythmiaType: hrvAnalysis.type,
        signalQuality: quality,
        confidence: spo2Result.confidence,
        readings: this.readings,
        isPeak: false,
        redValue: red,
        hrvMetrics: {
          sdnn: hrvAnalysis.sdnn,
          rmssd: hrvAnalysis.rmssd,
          pnn50: hrvAnalysis.pnn50,
          lfhf: hrvAnalysis.lfhf
        }
      };
    } catch (error) {
      console.error('Error procesando frame:', error);
      return null;
    }
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }

  updateSensitivitySettings(settings: SensitivitySettings) {
    this.sensitivitySettings = settings;
  }
}
