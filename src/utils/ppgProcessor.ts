
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
  private readonly windowSize = 150; // Reducido para menor latencia
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly qualityAnalyzer: SignalQualityAnalyzer;
  private beepPlayer: BeepPlayer;
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 15; // Reducido para mejor respuesta
  private readonly qualityThreshold = 0.15; // Reducido para mayor sensibilidad
  private frameCount: number = 0;
  private lastValidBpm: number = 0;
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 2.0, // Aumentado para mejor detección
    noiseReduction: 1.5,
    peakDetection: 1.5
  };
  
  private processingSettings = {
    MIN_RED_VALUE: 10, // Reducido para mayor sensibilidad
    MIN_VALID_PIXELS_RATIO: 0.15,
    MIN_BRIGHTNESS: 60,
    PEAK_THRESHOLD_FACTOR: 0.35,
    MIN_PEAK_DISTANCE: 250, // ms entre picos
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
    
    if (quality < this.qualityThreshold || red < this.processingSettings.MIN_RED_VALUE) {
      console.log('❌ No se detecta dedo o señal de baja calidad:', { 
        red: red.toFixed(2), 
        calidad: (quality * 100).toFixed(1) + '%',
        umbralCalidad: (this.qualityThreshold * 100).toFixed(1) + '%',
        umbralRojo: this.processingSettings.MIN_RED_VALUE
      });
      return null;
    }
    
    const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
    const amplifiedIr = ir * this.sensitivitySettings.signalAmplification;
    
    this.redBuffer.push(amplifiedRed);
    this.irBuffer.push(amplifiedIr);
    
    if (this.redBuffer.length > this.windowSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
    
    // Aplicar filtros más agresivos para reducir ruido
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

    const isPeak = this.peakDetector.isRealPeak(normalizedValue, now, this.signalBuffer);
    let calculatedBpm = 0;

    if (isPeak) {
      this.peakTimes.push(now);
      if (this.peakTimes.length > 10) {
        this.peakTimes.shift();
      }
      
      // Calcular BPM usando los últimos intervalos
      if (this.peakTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < this.peakTimes.length; i++) {
          intervals.push(this.peakTimes[i] - this.peakTimes[i-1]);
        }
        
        // Filtrar intervalos anómalos
        const validIntervals = intervals.filter(interval => 
          interval >= this.processingSettings.MIN_PEAK_DISTANCE && 
          interval <= this.processingSettings.MAX_PEAK_DISTANCE
        );
        
        if (validIntervals.length > 0) {
          const avgInterval = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
          calculatedBpm = Math.round(60000 / avgInterval);
          
          // Solo actualizar si el BPM está en un rango fisiológico
          if (calculatedBpm >= 30 && calculatedBpm <= 220) {
            this.lastValidBpm = calculatedBpm;
            console.log('💓 BPM válido detectado:', calculatedBpm);
          }
        }
      }
      
      await this.beepPlayer.playBeep('heartbeat', quality);
    }

    const signalQuality = this.qualityAnalyzer.analyzeSignalQuality(filteredRed);
    const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
    const bp = this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);

    return {
      bpm: this.lastValidBpm,
      spo2: spo2Result.spo2,
      systolic: bp.systolic,
      diastolic: bp.diastolic,
      signalQuality,
      confidence: spo2Result.confidence,
      readings: this.readings,
      isPeak,
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
    console.log('Sensitivity settings updated:', settings);
  }
}
