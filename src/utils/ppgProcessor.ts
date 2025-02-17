
import { VitalReading, PPGData, SensitivitySettings } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';
import { SignalExtractor } from './signalExtraction';
import { PeakDetector } from './peakDetection';
import { SignalNormalizer } from './signalNormalization';
import { SignalFilter } from './signalFilter';
import { SignalQualityAnalyzer } from './signalQualityAnalyzer';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private peakTimes: number[] = [];
  private readonly samplingRate = 30;
  private readonly windowSize = 150;
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly qualityAnalyzer: SignalQualityAnalyzer;
  private beepPlayer: BeepPlayer;
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 15;
  private readonly qualityThreshold = 0.15;
  private frameCount: number = 0;
  private lastValidBpm: number = 0;
  private bpmBuffer: number[] = []; // Buffer para suavizar BPM
  private lastBpmUpdate: number = 0;
  private readonly BPM_UPDATE_INTERVAL = 1000; // Actualizar BPM cada segundo
  private readonly BPM_BUFFER_SIZE = 5; // Tamaño del buffer para promedio móvil
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 2.0,
    noiseReduction: 1.5,
    peakDetection: 1.5
  };
  
  private processingSettings = {
    MIN_RED_VALUE: 10,
    MIN_VALID_PIXELS_RATIO: 0.15,
    MIN_BRIGHTNESS: 60,
    PEAK_THRESHOLD_FACTOR: 0.35,
    MIN_PEAK_DISTANCE: 250,
    MAX_PEAK_DISTANCE: 1500
  };
  
  constructor() {
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
    this.signalExtractor = new SignalExtractor();
    this.peakDetector = new PeakDetector();
    this.signalNormalizer = new SignalNormalizer();
    this.signalFilter = new SignalFilter(this.samplingRate);
    this.qualityAnalyzer = new SignalQualityAnalyzer();
  }

  private updateBpmSmooth(newBpm: number): number {
    const now = Date.now();
    
    // Añadir nuevo BPM al buffer
    this.bpmBuffer.push(newBpm);
    if (this.bpmBuffer.length > this.BPM_BUFFER_SIZE) {
      this.bpmBuffer.shift();
    }
    
    // Solo actualizar el BPM cada intervalo definido
    if (now - this.lastBpmUpdate >= this.BPM_UPDATE_INTERVAL) {
      // Calcular promedio del buffer
      const validBpms = this.bpmBuffer.filter(bpm => bpm > 0);
      if (validBpms.length > 0) {
        const avgBpm = Math.round(
          validBpms.reduce((a, b) => a + b, 0) / validBpms.length
        );
        this.lastValidBpm = avgBpm;
        this.lastBpmUpdate = now;
      }
    }
    
    return this.lastValidBpm;
  }

  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    this.frameCount++;
    const now = Date.now();
    
    const { red, ir, quality } = this.signalExtractor.extractChannels(imageData);
    
    // Validación más estricta de la calidad de la señal
    if (quality < this.qualityThreshold || red < this.processingSettings.MIN_RED_VALUE) {
      return {
        bpm: this.lastValidBpm,
        spo2: 0,
        systolic: 0,
        diastolic: 0,
        signalQuality: 0,
        confidence: 0,
        readings: this.readings,
        isPeak: false,
        hasArrhythmia: false,
        arrhythmiaType: 'Normal',
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
    
    if (this.redBuffer.length > this.windowSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
    
    const filteredRed = this.signalFilter.bandPassFilter(this.redBuffer, 0.5, 4.0);
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

    // Validación más estricta de picos para evitar falsos positivos
    const isPeak = this.peakDetector.isRealPeak(normalizedValue, now, this.signalBuffer);
    
    if (isPeak && quality > 0.3) { // Solo procesar picos con buena calidad de señal
      this.peakTimes.push(now);
      if (this.peakTimes.length > 10) {
        this.peakTimes.shift();
      }
      
      if (this.peakTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < this.peakTimes.length; i++) {
          const interval = this.peakTimes[i] - this.peakTimes[i-1];
          if (interval >= this.processingSettings.MIN_PEAK_DISTANCE && 
              interval <= this.processingSettings.MAX_PEAK_DISTANCE) {
            intervals.push(interval);
          }
        }
        
        if (intervals.length > 0) {
          const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
          const calculatedBpm = Math.round(60000 / avgInterval);
          
          if (calculatedBpm >= 30 && calculatedBpm <= 220) {
            this.lastValidBpm = calculatedBpm;
          }
        }
      }
      
      // Solo reproducir beep si es un pico válido y la calidad es muy buena
      if (quality > 0.5) {
        await this.beepPlayer.playBeep('heartbeat', quality);
      }
    }

    const signalQuality = this.qualityAnalyzer.analyzeSignalQuality(filteredRed);
    const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
    const bp = this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);

    // Retornar solo valores validados
    return {
      bpm: this.lastValidBpm,
      spo2: spo2Result.confidence > 0.5 ? spo2Result.spo2 : 0,
      systolic: bp.systolic,
      diastolic: bp.diastolic,
      signalQuality,
      confidence: spo2Result.confidence,
      readings: this.readings,
      isPeak: isPeak && quality > 0.3, // Solo indicar pico si la calidad es buena
      hasArrhythmia: false,
      arrhythmiaType: 'Normal',
      hrvMetrics: {
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        lfhf: 0
      }
    };
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }

  updateSensitivitySettings(settings: SensitivitySettings) {
    this.sensitivitySettings = settings;
  }
}
