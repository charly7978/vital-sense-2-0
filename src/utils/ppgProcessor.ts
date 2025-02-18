// ==================== PPGProcessor.ts ====================

import { SignalFilter } from './SignalFilter';
import { PeakDetector } from './PeakDetector';
import { SignalQualityAnalyzer } from './SignalQualityAnalyzer';
import { BeepPlayer } from './audioUtils';
import type { PPGData, VitalSigns, HRVMetrics, ArrhythmiaType } from '@/types';

export class PPGProcessor {
  // OPTIMIZACIÓN: Buffers más grandes para mejor análisis
  private readonly bufferSize = 60;       // Antes: 30
  private readonly windowSize = 360;      // Antes: 180 (12 segundos a 30fps)
  private readonly peakDetector: PeakDetector;
  private readonly signalFilter: SignalFilter;
  private readonly qualityAnalyzer: SignalQualityAnalyzer;
  private readonly beepPlayer: BeepPlayer;

  // OPTIMIZACIÓN: Nuevos umbrales para luz ambiente
  private readonly settings = {
    minAmplitude: 0.3,        // Antes: 0.1
    noiseThreshold: 0.4,      // Antes: 0.2
    signalQuality: 0.45,      // Antes: 0.25
    stabilityThreshold: 0.7,  // Antes: no existía
    minValidPeaks: 4,         // Antes: 2
    maxBpm: 180,
    minBpm: 45,
    calibrationFactor: 1.15   // Factor de corrección
  };

  // OPTIMIZACIÓN: Buffers mejorados
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private readings: Array<{ timestamp: number; value: number }> = [];
  private peakTimes: number[] = [];
  private lastValidBpm: number = 0;
  private lastValidTime: number = 0;
  private arrhythmiaBuffer: number[] = [];
  private readonly arrhythmiaWindowSize = 10;

  constructor() {
    this.peakDetector = new PeakDetector();
    this.signalFilter = new SignalFilter(30); // 30fps
    this.qualityAnalyzer = new SignalQualityAnalyzer();
    this.beepPlayer = new BeepPlayer();
  }

  // OPTIMIZACIÓN: Procesamiento de frame mejorado
  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    // OPTIMIZACIÓN: Extracción mejorada para luz ambiente
    const { red, ir, quality } = this.extractChannels(imageData);
    
    // OPTIMIZACIÓN: Validación más estricta
    if (quality < this.settings.signalQuality || 
        !this.validateSignal(red, ir)) {
      console.log('❌ Señal no válida:', { 
        red: red.toFixed(2), 
        calidad: (quality * 100).toFixed(1) + '%'
      });
      return null;
    }

    // OPTIMIZACIÓN: Actualización de buffers mejorada
    this.updateBuffers(red, ir);

    // OPTIMIZACIÓN: Procesamiento de señal mejorado
    const filteredSignal = this.signalFilter.processSignal(this.redBuffer);
    const normalizedSignal = this.normalizeSignal(filteredSignal);
    
    // OPTIMIZACIÓN: Detección de picos más precisa
    const isPeak = this.peakDetector.isRealPeak(
      normalizedSignal[normalizedSignal.length - 1],
      Date.now(),
      normalizedSignal
    );

    // OPTIMIZACIÓN: Manejo de picos mejorado
    if (isPeak && quality > 0.6) {
      this.handlePeak(Date.now(), quality);
    }

    // OPTIMIZACIÓN: Cálculo de vitales mejorado
    const vitals = this.calculateVitals();
    
    // OPTIMIZACIÓN: Análisis de HRV y arritmias
    const hrvMetrics = this.analyzeHRV();
    const arrhythmiaAnalysis = this.analyzeArrhythmia(hrvMetrics);

    return {
      ...vitals,
      hasArrhythmia: arrhythmiaAnalysis.hasArrhythmia,
      arrhythmiaType: arrhythmiaAnalysis.type,
      signalQuality: quality,
      confidence: this.calculateConfidence(quality, vitals),
      readings: this.readings,
      isPeak,
      hrvMetrics
    };
  }

  // OPTIMIZACIÓN: Extracción de canales mejorada
  private extractChannels(imageData: ImageData) {
    const data = imageData.data;
    let redSum = 0;
    let irSum = 0;
    let pixelCount = 0;
    
    // OPTIMIZACIÓN: Análisis de región central
    const width = imageData.width;
    const height = imageData.height;
    const margin = Math.floor(Math.min(width, height) * 0.2);
    
    for (let y = margin; y < height - margin; y++) {
      for (let x = margin; x < width - margin; x++) {
        const i = (y * width + x) * 4;
        redSum += data[i];     // Canal rojo
        irSum += data[i + 2];  // Canal azul como IR
        pixelCount++;
      }
    }

    const red = redSum / pixelCount;
    const ir = irSum / pixelCount;
    const quality = this.calculateSignalQuality(red, ir);

    return { red, ir, quality };
  }

  // OPTIMIZACIÓN: Validación de señal mejorada
  private validateSignal(red: number, ir: number): boolean {
    // OPTIMIZACIÓN: Rangos ajustados para luz ambiente
    const isInRange = 
      red >= 35 && red <= 150 && 
      ir >= 25;

    // OPTIMIZACIÓN: Validación de ratio
    const ratio = red / (ir + 1e-6);
    const isValidRatio = ratio > 1.2 && ratio < 2.5;

    // OPTIMIZACIÓN: Validación de estabilidad
    const stability = this.calculateStability([red, ir]);
    const isStable = stability > this.settings.stabilityThreshold;

    return isInRange && isValidRatio && isStable;
  }

  // OPTIMIZACIÓN: Manejo de picos mejorado
  private async handlePeak(timestamp: number, quality: number) {
    try {
      // OPTIMIZACIÓN: Beep mejorado
      await this.beepPlayer.playBeep('heartbeat', 5.0);
      
      // OPTIMIZACIÓN: Actualización de peaks
      this.peakTimes.push(timestamp);
      if (this.peakTimes.length > 10) {
        this.peakTimes.shift();
      }

      console.log('🫀 Pico detectado:', {
        tiempo: timestamp,
        calidad: quality.toFixed(2)
      });
    } catch (err) {
      console.error('Error en manejo de pico:', err);
    }
  }

  // OPTIMIZACIÓN: Cálculo de vitales mejorado
  private calculateVitals(): VitalSigns {
    const bpm = this.calculateBPM();
    const spo2 = this.calculateSpO2();
    const bloodPressure = this.estimateBloodPressure(bpm);

    return {
      bpm,
      spo2,
      ...bloodPressure
    };
  }

  // OPTIMIZACIÓN: Cálculo de BPM mejorado
  private calculateBPM(): number {
    if (this.peakTimes.length < this.settings.minValidPeaks) {
      return this.lastValidBpm;
    }

    const intervals = [];
    for (let i = 1; i < this.peakTimes.length; i++) {
      intervals.push(this.peakTimes[i] - this.peakTimes[i-1]);
    }

    // OPTIMIZACIÓN: Filtrado de intervalos mejorado
    const validIntervals = this.filterOutliers(intervals);
    if (validIntervals.length < 3) return this.lastValidBpm;

    // OPTIMIZACIÓN: Uso de mediana y factor de calibración
    const sortedIntervals = [...validIntervals].sort((a, b) => a - b);
    const median = sortedIntervals[Math.floor(validIntervals.length / 2)];
    
    const bpm = Math.round((60000 / median) * this.settings.calibrationFactor);

    // OPTIMIZACIÓN: Validación mejorada
    if (bpm >= this.settings.minBpm && 
        bpm <= this.settings.maxBpm &&
        (this.lastValidBpm === 0 || Math.abs(bpm - this.lastValidBpm) <= 15)) {
      this.lastValidBpm = bpm;
      this.lastValidTime = Date.now();
    }

    return this.lastValidBpm;
  }

  // OPTIMIZACIÓN: Cálculo de SpO2 mejorado
  private calculateSpO2(): number {
    if (this.redBuffer.length < 30 || this.irBuffer.length < 30) return 0;

    const redAC = this.calculateAC(this.redBuffer);
    const redDC = this.calculateDC(this.redBuffer);
    const irAC = this.calculateAC(this.irBuffer);
    const irDC = this.calculateDC(this.irBuffer);

    if (redDC === 0 || irDC === 0) return 0;

    const R = (redAC / redDC) / (irAC / irDC);
    
    // OPTIMIZACIÓN: Calibración no lineal
    let spo2 = 110 - 25 * R;
    if (R > 0.4 && R < 1.0) {
      spo2 = 110 - 22 * R;
    } else if (R >= 1.0) {
      spo2 = 105 - 20 * R;
    }

    return Math.min(Math.max(Math.round(spo2), 70), 100);
  }

  // OPTIMIZACIÓN: Estimación de presión arterial mejorada
  private estimateBloodPressure(bpm: number): { systolic: number; diastolic: number } {
    if (bpm === 0 || this.readings.length < 180) { // 6 segundos mínimo
      return { systolic: 0, diastolic: 0 };
    }

    // OPTIMIZACIÓN: Análisis de forma de onda
    const waveformFeatures = this.analyzePPGWaveform();
    
    // OPTIMIZACIÓN: Estimación basada en múltiples factores
    const baselineSystolic = 120;
    const baselineDiastolic = 80;
    
    const systolicFactor = this.calculateSystolicFactor(waveformFeatures);
    const diastolicFactor = this.calculateDiastolicFactor(waveformFeatures);

    const systolic = Math.round(baselineSystolic * systolicFactor);
    const diastolic = Math.round(baselineDiastolic * diastolicFactor);

    // OPTIMIZACIÓN: Validación de rangos
    return {
      systolic: this.validatePressure(systolic, 90, 180),
      diastolic: this.validatePressure(diastolic, 60, 120)
    };
  }

  // OPTIMIZACIÓN: Análisis de HRV mejorado
  private analyzeHRV(): HRVMetrics {
    if (this.peakTimes.length < 6) {
      return this.getEmptyHRVMetrics();
    }

    const intervals = [];
    for (let i = 1; i < this.peakTimes.length; i++) {
      intervals.push(this.peakTimes[i] - this.peakTimes[i-1]);
    }

    // OPTIMIZACIÓN: Cálculos de HRV mejorados
    const sdnn = this.calculateSDNN(intervals);
    const rmssd = this.calculateRMSSD(intervals);
    const pnn50 = this.calculatePNN50(intervals);

    return {
      sdnn,
      rmssd,
      pnn50,
      intervalVariability: this.calculateIntervalVariability(intervals)
    };
  }

  // OPTIMIZACIÓN: Análisis de arritmia mejorado
  private analyzeArrhythmia(hrvMetrics: HRVMetrics): {
    hasArrhythmia: boolean;
    type: ArrhythmiaType;
  } {
    // OPTIMIZACIÓN: Detección basada en múltiples factores
    const hasHighVariability = hrvMetrics.sdnn > 100;
    const hasIrregularIntervals = hrvMetrics.pnn50 > 20;
    const hasAbnormalPattern = this.detectAbnormalPattern();

    if (!hasHighVariability && !hasIrregularIntervals && !hasAbnormalPattern) {
      return { hasArrhythmia: false, type: 'Normal' };
    }

    // OPTIMIZACIÓN: Clasificación de arritmias
    if (hasHighVariability && hrvMetrics.rmssd > 50) {
      return { hasArrhythmia: true, type: 'Fibrilación Auricular' };
    }

    if (hasIrregularIntervals && !hasHighVariability) {
      return { hasArrhythmia: true, type: 'Extrasístoles' };
    }

    return { hasArrhythmia: true, type: 'Arritmia No Específica' };
  }

  // OPTIMIZACIÓN: Métodos auxiliares mejorados
  private calculateAC(signal: number[]): number {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    return Math.sqrt(signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length);
  }

  private calculateDC(signal: number[]): number {
    return signal.reduce((a, b) => a + b, 0) / signal.length;
  }

  private calculateStability(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    return Math.exp(-Math.sqrt(variance) / mean);
  }

  private filterOutliers(values: number[]): number[] {
    if (values.length < 4) return values;

    const sorted = [...values].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(values.length * 0.25)];
    const q3 = sorted[Math.floor(values.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    return values.filter(v => v >= lower && v <= upper);
  }

  private calculateSignalQuality(red: number, ir: number): number {
    const stability = this.calculateStability([red, ir]);
    const ratio = red / (ir + 1e-6);
    const ratioQuality = Math.exp(-Math.abs(ratio - 1.5));
    
    return Math.min(stability * 0.7 + ratioQuality * 0.3, 1);
  }

  private validatePressure(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private getEmptyHRVMetrics(): HRVMetrics {
    return {
      sdnn: 0,
      rmssd: 0,
      pnn50: 0,
      intervalVariability: 0
    };
  }

  // OPTIMIZACIÓN: Actualización de buffers mejorada
  private updateBuffers(red: number, ir: number): void {
    this.redBuffer.push(red);
    this.irBuffer.push(ir);

    if (this.redBuffer.length > this.bufferSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }

    const now = Date.now();
    this.readings.push({ timestamp: now, value: red });
    
    if (this.readings.length > this.windowSize) {
      this.readings.shift();
    }
  }

  // OPTIMIZACIÓN: Normalización de señal mejorada
  private normalizeSignal(signal: number[]): number[] {
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const range = max - min;
    
    return range === 0 ? signal : signal.map(v => (v - min) / range);
  }
}
