
import { VitalReading, PPGData, SensitivitySettings, ProcessingSettings } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';
import { SignalExtractor } from './signalExtraction';
import { PeakDetector } from './peakDetection';
import { SignalNormalizer } from './signalNormalization';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';

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
  private readonly qualityThreshold = 0.3;
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1,
    noiseReduction: 1,
    peakDetection: 1
  };
  public readonly processingSettings: ProcessingSettings = {
    MEASUREMENT_DURATION: 40,
    MIN_FRAMES_FOR_CALCULATION: 30,
    MIN_PEAKS_FOR_VALID_HR: 3,
    MIN_PEAK_DISTANCE: 500,
    MAX_PEAK_DISTANCE: 1500,
    PEAK_THRESHOLD_FACTOR: 0.2,
    MIN_RED_VALUE: 20,
    MIN_RED_DOMINANCE: 1.5,
    MIN_VALID_PIXELS_RATIO: 0.3,
    MIN_BRIGHTNESS: 100,
    MIN_VALID_READINGS: 50,
    FINGER_DETECTION_DELAY: 1000,
    MIN_SPO2: 80
  };
  
  constructor() {
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
    this.signalExtractor = new SignalExtractor();
    this.peakDetector = new PeakDetector();
    this.signalNormalizer = new SignalNormalizer();
    this.signalFilter = new SignalFilter(this.samplingRate);
    this.frequencyAnalyzer = new SignalFrequencyAnalyzer(this.samplingRate);
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
