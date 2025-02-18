// ==================== SignalProcessor.ts ====================

import { SignalFilter } from './SignalFilter';
import { SignalQualityAnalyzer } from './SignalQualityAnalyzer';
import { PPGFeatureExtractor } from './PPGFeatureExtractor';
import type { VitalSigns, BloodPressure, ArrhythmiaType } from '@/types';

export class SignalProcessor {
  // OPTIMIZACIÓN: Constantes ajustadas para mejor detección sin linterna
  private readonly MAX_BPM = 180;
  private readonly MIN_BPM = 45;
  private readonly MIN_VALID_INTERVALS = 4;
  private readonly CALIBRATION_FACTOR = 1.15;
  private readonly MIN_RED_VALUE = 35;    // Antes: 15 (muy permisivo)
  private readonly MAX_RED_VALUE = 150;   // Antes: 245 (permitía saturación)
  private readonly MIN_IR_VALUE = 25;     // Antes: no existía
  private readonly MIN_SIGNAL_QUALITY = 0.45;  // Antes: 0.25
  private readonly MIN_STABILITY = 0.7;   // Antes: 0.5
  private readonly REQUIRED_CONSISTENT_FRAMES = 5;  // Antes: 2

  // OPTIMIZACIÓN: Buffers mejorados
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private lastValidFrames: number = 0;
  private previousValues: number[] = [];
  private peakTimes: number[] = [];
  private lastValidBpm: number = 0;
  private lastValidTime: number = 0;
  private readonly bufferSize = 60;  // Antes: 30

  // OPTIMIZACIÓN: Componentes mejorados
  private readonly signalFilter: SignalFilter;
  private readonly qualityAnalyzer: SignalQualityAnalyzer;
  private readonly featureExtractor: PPGFeatureExtractor;

  constructor() {
    this.signalFilter = new SignalFilter();
    this.qualityAnalyzer = new SignalQualityAnalyzer();
    this.featureExtractor = new PPGFeatureExtractor();
  }

  // OPTIMIZACIÓN: Procesamiento principal mejorado
  processFrame(imageData: ImageData): VitalSigns | null {
    if (!this.validateFingerPresence(imageData)) {
      return null;
    }

    const { red, ir } = this.extractChannels(imageData);
    this.updateBuffers(red, ir);

    // OPTIMIZACIÓN: Pipeline de procesamiento mejorado
    const filteredRed = this.signalFilter.processSignal(this.redBuffer);
    const filteredIr = this.signalFilter.processSignal(this.irBuffer);

    const peaks = this.detectPeaks(filteredRed);
    const intervals = this.calculateIntervals(peaks);

    return this.calculateVitals(intervals);
  }

  // OPTIMIZACIÓN: Validación de dedo mejorada
  private validateFingerPresence(imageData: ImageData): boolean {
    const { red, ir } = this.extractChannels(imageData);
    
    // OPTIMIZACIÓN: Validaciones múltiples
    const isInRange = 
      red >= this.MIN_RED_VALUE && 
      red <= this.MAX_RED_VALUE && 
      ir >= this.MIN_IR_VALUE;

    if (!isInRange) {
      this.lastValidFrames = 0;
      return false;
    }

    // OPTIMIZACIÓN: Validación de ratio mejorada
    const ratio = red / (ir + 1e-6);
    const isValidRatio = ratio > 1.2 && ratio < 2.5;
    
    if (!isValidRatio) {
      this.lastValidFrames = 0;
      return false;
    }

    // OPTIMIZACIÓN: Validación de estabilidad
    this.previousValues.push(red);
    if (this.previousValues.length > 10) {
      this.previousValues.shift();
    }

    const stability = this.calculateStability(this.previousValues);
    if (stability < this.MIN_STABILITY) {
      this.lastValidFrames = 0;
      return false;
    }

    // OPTIMIZACIÓN: Validación de cobertura
    const coverage = this.calculateFingerCoverage(imageData);
    if (coverage < 0.6) {
      this.lastValidFrames = 0;
      return false;
    }

    // OPTIMIZACIÓN: Validación temporal
    this.lastValidFrames++;
    return this.lastValidFrames >= this.REQUIRED_CONSISTENT_FRAMES;
  }

  // OPTIMIZACIÓN: Extracción de canales mejorada
  private extractChannels(imageData: ImageData): { red: number; ir: number } {
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

    return {
      red: redSum / pixelCount,
      ir: irSum / pixelCount
    };
  }

  // OPTIMIZACIÓN: Cálculo de vitales mejorado
  private calculateVitals(intervals: number[]): VitalSigns {
    const validIntervals = this.filterIntervals(intervals);
    
    if (validIntervals.length < this.MIN_VALID_INTERVALS) {
      return this.getEmptyReading();
    }

    const bpm = this.calculateCorrectedBPM(validIntervals);
    const spo2 = this.calculateCorrectedSpO2();
    const bloodPressure = this.calculateCorrectedBloodPressure(bpm);
    const arrhythmia = this.analyzeArrhythmia(validIntervals);

    return {
      bpm,
      spo2,
      ...bloodPressure,
      hasArrhythmia: arrhythmia.hasArrhythmia,
      arrhythmiaType: arrhythmia.type,
      quality: this.qualityAnalyzer.analyzeSignalQuality(this.redBuffer)
    };
  }

  // OPTIMIZACIÓN: Cálculo de BPM mejorado
  private calculateCorrectedBPM(intervals: number[]): number {
    const sortedIntervals = [...intervals].sort((a, b) => a - b);
    const median = sortedIntervals[Math.floor(intervals.length / 2)];
    
    let bpm = Math.round((60000 / median) * this.CALIBRATION_FACTOR);
    
    if (bpm >= this.MIN_BPM && bpm <= this.MAX_BPM) {
      if (this.lastValidBpm === 0 || Math.abs(bpm - this.lastValidBpm) <= 15) {
        this.lastValidBpm = bpm;
        this.lastValidTime = Date.now();
      }
    }

    return this.lastValidBpm;
  }

  // OPTIMIZACIÓN: Cálculo de SpO2 mejorado
  private calculateCorrectedSpO2(): number {
    const redAC = this.calculateAC(this.redBuffer);
    const redDC = this.calculateDC(this.redBuffer);
    const irAC = this.calculateAC(this.irBuffer);
    const irDC = this.calculateDC(this.irBuffer);

    if (redDC === 0 || irDC === 0) return 0;

    const R = (redAC / redDC) / (irAC / irDC);
    
    // OPTIMIZACIÓN: Calibración no lineal mejorada
    let spo2 = 110 - 25 * R;
    
    if (R > 0.4 && R < 1.0) {
      spo2 = 110 - 22 * R;
    } else if (R >= 1.0) {
      spo2 = 105 - 20 * R;
    }

    return Math.min(Math.max(Math.round(spo2), 70), 100);
  }

  // OPTIMIZACIÓN: Cálculo de presión arterial mejorado
  private calculateCorrectedBloodPressure(bpm: number): BloodPressure {
    if (bpm === 0) return { systolic: 0, diastolic: 0 };

    // OPTIMIZACIÓN: Análisis de forma de onda PPG
    const waveformFeatures = this.analyzePPGWaveform();
    
    const baselineSystolic = 120;
    const baselineDiastolic = 80;
    
    const systolicFactor = this.calculateSystolicFactor(waveformFeatures);
    const diastolicFactor = this.calculateDiastolicFactor(waveformFeatures);

    const systolic = Math.round(baselineSystolic * systolicFactor);
    const diastolic = Math.round(baselineDiastolic * diastolicFactor);

    return {
      systolic: this.validatePressure(systolic, 90, 180),
      diastolic: this.validatePressure(diastolic, 60, 120)
    };
  }

  // OPTIMIZACIÓN: Análisis de arritmia mejorado
  private analyzeArrhythmia(intervals: number[]): {
    hasArrhythmia: boolean;
    type: ArrhythmiaType;
  } {
    if (intervals.length < 6) {
      return { hasArrhythmia: false, type: 'Normal' };
    }

    const rmssd = this.calculateRMSSD(intervals);
    const pnn50 = this.calculatePNN50(intervals);
    const variability = this.calculateIntervalVariability(intervals);

    // OPTIMIZACIÓN: Detección mejorada
    const hasHighVariability = rmssd > 50;
    const hasIrregularIntervals = pnn50 > 20;
    const hasAbnormalPattern = variability > 0.2;

    if (!hasHighVariability && !hasIrregularIntervals && !hasAbnormalPattern) {
      return { hasArrhythmia: false, type: 'Normal' };
    }

    // OPTIMIZACIÓN: Clasificación mejorada
    if (hasHighVariability && rmssd > 100) {
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

  private calculateRMSSD(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    
    let sum = 0;
    for (let i = 1; i < intervals.length; i++) {
      sum += Math.pow(intervals[i] - intervals[i-1], 2);
    }
    
    return Math.sqrt(sum / (intervals.length - 1));
  }

  private calculatePNN50(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    
    let nn50 = 0;
    for (let i = 1; i < intervals.length; i++) {
      if (Math.abs(intervals[i] - intervals[i-1]) > 50) {
        nn50++;
      }
    }
    
    return (nn50 / (intervals.length - 1)) * 100;
  }

  private calculateIntervalVariability(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    
    return Math.sqrt(variance) / mean;
  }

  private validatePressure(value: number, min: number, max: number): number {
    return Math.min(Math.max(value, min), max);
  }

  private getEmptyReading(): VitalSigns {
    return {
      bpm: 0,
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      hasArrhythmia: false,
      arrhythmiaType: 'Normal',
      quality: 0
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
  }

  // OPTIMIZACIÓN: Análisis de forma de onda PPG mejorado
  private analyzePPGWaveform() {
    return this.featureExtractor.extractFeatures(this.redBuffer);
  }

  private calculateSystolicFactor(features: any): number {
    const { amplitude, width, slope } = features;
    return 1 + (amplitude * 0.3 + width * 0.2 + slope * 0.1);
  }

  private calculateDiastolicFactor(features: any): number {
    const { amplitude, width, slope } = features;
    return 1 + (amplitude * 0.2 + width * 0.1 + slope * 0.1);
  }

  // OPTIMIZACIÓN: Filtrado de intervalos mejorado
  private filterIntervals(intervals: number[]): number[] {
    if (intervals.length < 4) return intervals;

    const sorted = [...intervals].sort((a, b) => a - b);
    const q1 = sorted[Math.floor(intervals.length * 0.25)];
    const q3 = sorted[Math.floor(intervals.length * 0.75)];
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    return intervals.filter(v => v >= lower && v <= upper);
  }

  // OPTIMIZACIÓN: Cálculo de cobertura de dedo mejorado
  private calculateFingerCoverage(imageData: ImageData): number {
    const data = imageData.data;
    const width = imageData.width;
    const height = imageData.height;
    let coveredPixels = 0;
    let totalPixels = 0;

    const margin = Math.floor(Math.min(width, height) * 0.2);

    for (let y = margin; y < height - margin; y++) {
      for (let x = margin; x < width - margin; x++) {
        const i = (y * width + x) * 4;
        if (data[i] >= this.MIN_RED_VALUE && data[i] <= this.MAX_RED_VALUE) {
          coveredPixels++;
        }
        totalPixels++;
      }
    }

    return coveredPixels / totalPixels;
  }
}
