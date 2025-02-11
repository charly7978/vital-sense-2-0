import { VitalReading, PPGData, SensitivitySettings } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';
import { SignalExtractor } from './signalExtraction';
import { PeakDetector } from './peakDetection';
import { SignalNormalizer } from './signalNormalization';

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
  private beepPlayer: BeepPlayer;
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 30;
  private readonly qualityThreshold = 0.6;
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1,
    noiseReduction: 1,
    peakDetection: 1
  };
  
  constructor() {
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
    this.signalExtractor = new SignalExtractor();
    this.peakDetector = new PeakDetector();
    this.signalNormalizer = new SignalNormalizer();
  }

  updateSensitivitySettings(settings: SensitivitySettings) {
    this.sensitivitySettings = settings;
  }

  processFrame(imageData: ImageData): PPGData | null {
    const now = Date.now();
    
    const { red, ir, quality, perfusionIndex } = this.signalExtractor.extractChannels(imageData);
    
    if (quality < this.qualityThreshold || red < 50) {
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
    
    // Aplicar amplificación de señal
    const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
    const amplifiedIr = ir * this.sensitivitySettings.signalAmplification;
    
    this.redBuffer.push(amplifiedRed);
    this.irBuffer.push(amplifiedIr);
    
    if (this.redBuffer.length > this.windowSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
    
    const filteredRed = this.signalProcessor.lowPassFilter(this.redBuffer, 
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
      
      if (this.peakTimes.length > 10) {
        this.peakTimes.shift();
      }
      
      this.beepPlayer.playBeep().catch(err => {
        console.error('Error al reproducir beep:', err);
      });
    }

    const { frequencies, magnitudes } = this.signalProcessor.performFFT(filteredRed);
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
