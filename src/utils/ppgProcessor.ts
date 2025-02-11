
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
  private processingSettings: ProcessingSettings = {
    measurementDuration: 30,
    minFramesForCalculation: 30,
    minPeaksForValidHR: 3,
    minPeakDistance: 500,
    maxPeakDistance: 1500,
    peakThresholdFactor: 0.5,
    minRedValue: 20,
    minRedDominance: 1.5,
    minValidPixelsRatio: 0.3,
    minBrightness: 30,
    minValidReadings: 10,
    fingerDetectionDelay: 1000,
    minSpO2: 80
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
      if (key in this.processingSettings) {
        (this.processingSettings as any)[key] = value;
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
        isPeak: false
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

    const { frequencies, magnitudes } = this.frequencyAnalyzer.performFFT(filteredRed);
    const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
    const dominantFreq = frequencies[dominantFreqIndex];
    const fftBpm = dominantFreq * 60;
    
    const intervals = [];
    for (let i = 1; i < this.peakTimes.length; i++) {
      intervals.push(this.peakTimes[i] - this.peakTimes[i-1]);
    }
    
    const hrvAnalysis = this.signalProcessor.analyzeHRV(intervals);
    const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer, perfusionIndex);
    
    const bp = this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);
    
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
