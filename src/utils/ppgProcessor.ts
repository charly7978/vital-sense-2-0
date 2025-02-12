
import { VitalReading, PPGData, SensitivitySettings, ProcessingSettings } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';
import { SignalExtractor } from './signalExtraction';
import { PeakDetector } from './peakDetection';
import { SignalNormalizer } from './signalNormalization';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';
import { MLModel } from './mlModel';
import { VitalsValidator } from './vitalsValidator';
import { PPGDataManager } from './ppgDataManager';

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
  private readonly vitalsValidator: VitalsValidator;
  private readonly dataManager: PPGDataManager;
  private beepPlayer: BeepPlayer;
  private signalBuffer: number[] = [];
  private readonly bufferSize = 15;
  private readonly qualityThreshold = 0.2;
  private mlModel: MLModel;
  private lastProcessingTime: number = 0;
  private readonly minProcessingInterval = 50;
  
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
    this.vitalsValidator = new VitalsValidator();
    this.dataManager = new PPGDataManager();
  }

  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    const now = Date.now();
    
    try {
      if (now - this.lastProcessingTime < this.minProcessingInterval) {
        return null;
      }
      this.lastProcessingTime = now;

      const extractionResult = this.signalExtractor.extractChannels(imageData);
      const { red, ir, quality, diagnostics } = extractionResult;
      
      console.log('Frame procesado:', {
        timestamp: now,
        frameInterval: now - this.lastProcessingTime,
        rawRedValue: red.toFixed(3),
        signalQuality: (quality * 100).toFixed(1) + '%',
        pixelesValidos: diagnostics.validPixels,
        variacionRojo: diagnostics.rawRedValues.length > 0 ? 
          (Math.max(...diagnostics.rawRedValues) - Math.min(...diagnostics.rawRedValues)).toFixed(3) : 'N/A'
      });
      
      if (quality < this.qualityThreshold || red < this.processingSettings.MIN_RED_VALUE) {
        console.log('Señal insuficiente:', {
          calidad: (quality * 100).toFixed(1) + '%',
          valorRojo: red.toFixed(1),
          umbralCalidad: (this.qualityThreshold * 100).toFixed(1) + '%',
          umbralRojo: this.processingSettings.MIN_RED_VALUE
        });
        return null;
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

      this.dataManager.cleanupData(
        this.readings,
        this.redBuffer,
        this.irBuffer,
        this.peakTimes,
        this.signalBuffer,
        this.windowSize,
        this.bufferSize
      );

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
      const bp = this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);
      const validatedVitals = this.vitalsValidator.validateVitalSigns(calculatedBpm, bp.systolic, bp.diastolic);

      console.log('Mediciones calculadas:', {
        bpm: validatedVitals.bpm,
        spo2: spo2Result.spo2,
        presion: `${validatedVitals.systolic}/${validatedVitals.diastolic}`,
        intervalosRR: intervals.length,
        confianza: spo2Result.confidence
      });

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
        isPeak,
        redValue: red,
        rawDiagnostics: diagnostics,
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
