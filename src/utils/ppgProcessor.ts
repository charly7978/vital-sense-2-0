import { VitalReading, PPGData, SensitivitySettings, ProcessingSettings } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';
import { SignalExtractor } from './signalExtraction';
import { PeakDetector } from './peakDetection';
import { SignalNormalizer } from './signalNormalization';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';

export const DEFAULT_PROCESSING_SETTINGS: ProcessingSettings = {
  MEASUREMENT_DURATION: 30,         // 30 segundos es suficiente para una medición precisa
  MIN_FRAMES_FOR_CALCULATION: 15,   // Necesitamos menos frames para empezar a calcular
  MIN_PEAKS_FOR_VALID_HR: 2,       // Con 2 picos ya podemos empezar a estimar
  MIN_PEAK_DISTANCE: 400,          // ~150 BPM máximo
  MAX_PEAK_DISTANCE: 1200,         // ~50 BPM mínimo
  PEAK_THRESHOLD_FACTOR: 0.4,      // Factor más agresivo para detectar picos
  MIN_RED_VALUE: 15,               // Umbral más bajo para detectar dedo
  MIN_RED_DOMINANCE: 1.2,          // Menos restrictivo en dominancia roja
  MIN_VALID_PIXELS_RATIO: 0.2,     // Menor área requerida
  MIN_BRIGHTNESS: 80,              // Menor brillo requerido
  MIN_VALID_READINGS: 30,          // Menos lecturas requeridas
  FINGER_DETECTION_DELAY: 500,     // Menos delay para detección
  MIN_SPO2: 75                     // Rango más amplio para SpO2
};

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private peakTimes: number[] = [];
  private readonly samplingRate = 30;
  private readonly windowSize = 300;
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private beepPlayer: BeepPlayer;
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 30;
  private readonly qualityThreshold = 0.2;  // Bajamos el umbral de calidad
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1.5,    // Aumentamos la amplificación
    noiseReduction: 1.2,         // Aumentamos reducción de ruido
    peakDetection: 1.3           // Aumentamos sensibilidad de picos
  };
  public processingSettings: ProcessingSettings = DEFAULT_PROCESSING_SETTINGS;
  
  constructor() {
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
    this.signalExtractor = new SignalExtractor();
    this.peakDetector = new PeakDetector();
    this.signalNormalizer = new SignalNormalizer();
    this.signalFilter = new SignalFilter(this.samplingRate);
    this.frequencyAnalyzer = new SignalFrequencyAnalyzer(this.samplingRate);
  }

  updateProcessingSettings(newSettings: ProcessingSettings) {
    this.processingSettings = { ...this.processingSettings, ...newSettings };
    console.log('Updated processing settings:', this.processingSettings);
  }

  updateSensitivitySettings(settings: any) {
    if (settings.signalAmplification) {
      this.sensitivitySettings.signalAmplification = settings.signalAmplification;
    }
    if (settings.noiseReduction) {
      this.sensitivitySettings.noiseReduction = settings.noiseReduction;
    }
    if (settings.peakDetection) {
      this.sensitivitySettings.peakDetection = settings.peakDetection;
    }

    Object.entries(settings).forEach(([key, value]: [string, any]) => {
      const uppercaseKey = key.toUpperCase();
      if (uppercaseKey in this.processingSettings) {
        (this.processingSettings as any)[uppercaseKey] = value;
      }
    });

    this.signalFilter.updateKalmanParameters(
      settings.kalmanQ || 0.1,
      settings.kalmanR || 1
    );
    
    console.log('Updated settings:', {
      sensitivity: this.sensitivitySettings,
      processing: this.processingSettings
    });
  }

  processFrame(imageData: ImageData): PPGData | null {
    const now = Date.now();
    
    const { red, ir, quality, perfusionIndex } = this.signalExtractor.extractChannels(imageData);
    
    if (quality < this.qualityThreshold || red < 20) {
      console.log('No se detecta dedo o señal de baja calidad', { red, quality });
      this.redBuffer = [];
      this.irBuffer = [];
      this.readings = [];
      this.peakTimes = [];
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
    
    const amplifiedRed = Math.max(red * this.sensitivitySettings.signalAmplification, red * 1.2);
    const amplifiedIr = Math.max(ir * this.sensitivitySettings.signalAmplification, ir * 1.2);
    
    this.redBuffer.push(amplifiedRed);
    this.irBuffer.push(amplifiedIr);
    
    if (this.redBuffer.length > this.windowSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
    
    const filteredRed = this.signalFilter.lowPassFilter(this.redBuffer, 
      5 * this.sensitivitySettings.noiseReduction);
    const normalizedValue = this.signalNormalizer.normalizeSignal(
      filteredRed[filteredRed.length - 1]
    );
    
    this.readings.push({ timestamp: now, value: normalizedValue });
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }

    this.signalBuffer.push(normalizedValue);
    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer.shift();
    }

    const isPeak = this.peakDetector.isRealPeak(normalizedValue, now, this.signalBuffer);

    if (isPeak) {
      this.peakTimes.push(now);
      console.log('Peak detected:', { normalizedValue, time: now });
      
      if (this.peakTimes.length > 10) {
        this.peakTimes.shift();
      }
      
      this.beepPlayer.playBeep('heartbeat').catch(err => {
        console.error('Error al reproducir beep:', err);
      });
    }

    // Calculate heart rate using frequency analysis
    const { frequencies, magnitudes } = this.frequencyAnalyzer.performFFT(filteredRed);
    const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
    const dominantFreq = frequencies[dominantFreqIndex];
    const fftBpm = dominantFreq * 60;
    
    // Calculate intervals for HRV analysis
    const intervals = [];
    for (let i = 1; i < this.peakTimes.length; i++) {
      intervals.push(this.peakTimes[i] - this.peakTimes[i-1]);
    }
    
    // Get HRV analysis
    const hrvAnalysis = this.signalProcessor.analyzeHRV(intervals);
    
    // Calculate SpO2
    const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer, perfusionIndex);
    
    // Calculate blood pressure using PTT and PPG features
    const bp = this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);
    
    // Analyze signal quality
    const signalQuality = this.signalProcessor.analyzeSignalQuality(filteredRed);
    
    return {
      bpm: Math.round(fftBpm),
      spo2: spo2Result.spo2,
      systolic: bp.systolic,
      diastolic: bp.diastolic,
      hasArrhythmia: hrvAnalysis.hasArrhythmia,
      arrhythmiaType: hrvAnalysis.type,
      signalQuality,
      confidence: spo2Result.confidence,
      readings: this.readings,
      isPeak,
      hrvMetrics: {
        sdnn: hrvAnalysis.sdnn,
        rmssd: hrvAnalysis.rmssd,
        pnn50: hrvAnalysis.pnn50,
        lfhf: hrvAnalysis.lfhf
      }
    };
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }
}
