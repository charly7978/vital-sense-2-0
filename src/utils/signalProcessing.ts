// ==================== SignalProcessor.ts ====================

import { FingerDetector } from './FingerDetector';
import { PPGSynchronizer } from './PPGSynchronizer';
import { AdaptiveCalibrator } from './AdaptiveCalibrator';
import { WaveletAnalyzer } from './WaveletAnalyzer';
import { SignalFilter } from './SignalFilter';
import { SignalQualityAnalyzer } from './SignalQualityAnalyzer';
import type { VitalSigns, BloodPressure, ArrhythmiaType } from '@/types';

export class SignalProcessor {
  // OPTIMIZACIÓN: Componentes avanzados
  private readonly fingerDetector: FingerDetector;
  private readonly ppgSynchronizer: PPGSynchronizer;
  private readonly calibrator: AdaptiveCalibrator;
  private readonly waveletAnalyzer: WaveletAnalyzer;
  private readonly signalFilter: SignalFilter;
  private readonly qualityAnalyzer: SignalQualityAnalyzer;

  // OPTIMIZACIÓN: Constantes mejoradas
  private readonly THRESHOLDS = {
    minBpm: 45,
    maxBpm: 180,
    minValidIntervals: 4,
    minSignalQuality: 0.45,
    minStability: 0.7,
    requiredFrames: 5
  };

  // OPTIMIZACIÓN: Buffers mejorados
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private readonly bufferSize = 180;  // 6 segundos a 30fps
  private lastValidReading: VitalSigns | null = null;
  private measurementStartTime: number = 0;

  constructor() {
    this.fingerDetector = new FingerDetector();
    this.ppgSynchronizer = new PPGSynchronizer();
    this.calibrator = new AdaptiveCalibrator();
    this.waveletAnalyzer = new WaveletAnalyzer();
    this.signalFilter = new SignalFilter();
    this.qualityAnalyzer = new SignalQualityAnalyzer();
  }

  // OPTIMIZACIÓN: Procesamiento principal mejorado
  processFrame(imageData: ImageData): VitalSigns | null {
    try {
      // OPTIMIZACIÓN: Detección de dedo mejorada
      const fingerDetection = this.fingerDetector.detectFinger(imageData);
      if (!fingerDetection.isPresent) {
        return null;
      }

      // OPTIMIZACIÓN: Extracción y sincronización
      const { red, ir } = this.extractChannels(imageData);
      const timestamp = Date.now();
      
      // OPTIMIZACIÓN: Actualización de buffers
      this.updateBuffers(red, ir, timestamp);

      // OPTIMIZACIÓN: Análisis wavelet
      const waveletAnalysis = this.waveletAnalyzer.analyzeSignal(this.redBuffer);

      // OPTIMIZACIÓN: Sincronización PPG
      const syncResult = this.ppgSynchronizer.synchronize(red, timestamp);

      // OPTIMIZACIÓN: Cálculo de vitales con calibración
      const vitals = this.calculateVitals(syncResult, waveletAnalysis);

      // OPTIMIZACIÓN: Validación y suavizado
      const validatedVitals = this.validateAndSmoothVitals(vitals);

      // OPTIMIZACIÓN: Actualización de último válido
      if (validatedVitals.quality > this.THRESHOLDS.minSignalQuality) {
        this.lastValidReading = validatedVitals;
      }

      return validatedVitals;

    } catch (error) {
      console.error('Error en procesamiento:', error);
      return this.lastValidReading || this.getEmptyReading();
    }
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
  private calculateVitals(syncResult: any, waveletAnalysis: any): VitalSigns {
    // OPTIMIZACIÓN: Condiciones de señal
    const conditions: SignalConditions = {
      signalQuality: waveletAnalysis.quality,
      lightLevel: this.calculateLightLevel(),
      movement: syncResult.syncStatus.quality,
      coverage: this.calculateCoverage(),
      temperature: this.estimateTemperature(),
      measurementType: 'bpm'
    };

    // OPTIMIZACIÓN: Cálculo de BPM calibrado
    const rawBpm = this.calculateRawBPM(syncResult.frequency);
    const calibratedBpm = this.calibrator.calibrate(rawBpm, conditions);

    // OPTIMIZACIÓN: SpO2 con calibración
    conditions.measurementType = 'spo2';
    const rawSpo2 = this.calculateRawSpO2();
    const calibratedSpo2 = this.calibrator.calibrate(rawSpo2, conditions);

    // OPTIMIZACIÓN: Presión arterial calibrada
    const bloodPressure = this.calculateBloodPressure(calibratedBpm.value);

    // OPTIMIZACIÓN: Análisis de arritmia
    const arrhythmia = this.analyzeArrhythmia(waveletAnalysis);

    return {
      bpm: calibratedBpm.value,
      spo2: calibratedSpo2.value,
      systolic: bloodPressure.systolic,
      diastolic: bloodPressure.diastolic,
      quality: waveletAnalysis.quality,
      hasArrhythmia: arrhythmia.hasArrhythmia,
      arrhythmiaType: arrhythmia.type
    };
  }

  // OPTIMIZACIÓN: Cálculo de BPM mejorado
  private calculateRawBPM(frequency: number): number {
    return frequency * 60;
  }

  // OPTIMIZACIÓN: Cálculo de SpO2 mejorado
  private calculateRawSpO2(): number {
    const redAC = this.calculateAC(this.redBuffer);
    const redDC = this.calculateDC(this.redBuffer);
    const irAC = this.calculateAC(this.irBuffer);
    const irDC = this.calculateDC(this.irBuffer);

    if (redDC === 0 || irDC === 0) return 0;

    const R = (redAC / redDC) / (irAC / irDC);
    return 110 - 25 * R;
  }

  // OPTIMIZACIÓN: Cálculo de presión arterial mejorado
  private calculateBloodPressure(bpm: number): BloodPressure {
    const conditions: SignalConditions = {
      signalQuality: this.waveletAnalyzer.analyzeSignal(this.redBuffer).quality,
      lightLevel: this.calculateLightLevel(),
      movement: this.calculateMovement(),
      coverage: this.calculateCoverage(),
      temperature: this.estimateTemperature(),
      measurementType: 'systolic'
    };

    const rawSystolic = 120 + (bpm - 70) * 0.7;
    const calibratedSystolic = this.calibrator.calibrate(rawSystolic, conditions);

    conditions.measurementType = 'diastolic';
    const rawDiastolic = 80 + (bpm - 70) * 0.4;
    const calibratedDiastolic = this.calibrator.calibrate(rawDiastolic, conditions);

    return {
      systolic: calibratedSystolic.value,
      diastolic: calibratedDiastolic.value
    };
  }

  // OPTIMIZACIÓN: Análisis de arritmia mejorado
  private analyzeArrhythmia(waveletAnalysis: any): {
    hasArrhythmia: boolean;
    type: ArrhythmiaType;
  } {
    const peaks = waveletAnalysis.peaks;
    const intervals = this.calculatePeakIntervals(peaks);
    
    if (intervals.length < 6) {
      return { hasArrhythmia: false, type: 'Normal' };
    }

    const variability = this.calculateHeartRateVariability(intervals);
    const pattern = this.analyzeRhythmPattern(intervals);

    if (variability > 0.2 && pattern.isIrregular) {
      return { hasArrhythmia: true, type: 'Fibrilación Auricular' };
    }

    if (pattern.hasExtraBeats) {
      return { hasArrhythmia: true, type: 'Extrasístoles' };
    }

    return { hasArrhythmia: false, type: 'Normal' };
  }

  // OPTIMIZACIÓN: Métodos auxiliares mejorados
  private calculateAC(signal: number[]): number {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    return Math.sqrt(signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length);
  }

  private calculateDC(signal: number[]): number {
    return signal.reduce((a, b) => a + b, 0) / signal.length;
  }

  private calculateHeartRateVariability(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    
    const differences = intervals.slice(1).map((interval, i) => 
      Math.abs(interval - intervals[i])
    );
    
    return Math.sqrt(differences.reduce((a, b) => a + b * b, 0) / differences.length);
  }

  private analyzeRhythmPattern(intervals: number[]): {
    isIrregular: boolean;
    hasExtraBeats: boolean;
  } {
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const deviations = intervals.map(i => Math.abs(i - mean) / mean);
    
    return {
      isIrregular: deviations.some(d => d > 0.2),
      hasExtraBeats: intervals.some((i, idx) => 
        idx > 0 && Math.abs(i - intervals[idx-1]) > mean * 0.5
      )
    };
  }

  private calculateLightLevel(): number {
    const redMean = this.calculateDC(this.redBuffer);
    return this.normalizeValue(redMean, 0, 255);
  }

  private calculateMovement(): number {
    if (this.redBuffer.length < 2) return 0;
    
    const differences = this.redBuffer.slice(1).map((val, i) => 
      Math.abs(val - this.redBuffer[i])
    );
    
    return Math.min(differences.reduce((a, b) => a + b, 0) / differences.length / 10, 1);
  }

  private calculateCoverage(): number {
    return this.fingerDetector.detectFinger(this.lastImageData).confidence;
  }

  private estimateTemperature(): number {
    // Estimación simple basada en IR
    return 20 + this.calculateDC(this.irBuffer) / 10;
  }

  private normalizeValue(value: number, min: number, max: number): number {
    return Math.min(Math.max((value - min) / (max - min), 0), 1);
  }

  private updateBuffers(red: number, ir: number, timestamp: number): void {
    this.redBuffer.push(red);
    this.irBuffer.push(ir);
    this.timeBuffer.push(timestamp);

    if (this.redBuffer.length > this.bufferSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
      this.timeBuffer.shift();
    }
  }

  private validateAndSmoothVitals(vitals: VitalSigns): VitalSigns {
    if (!this.lastValidReading) return vitals;

    return {
      ...vitals,
      bpm: this.smoothValue(vitals.bpm, this.lastValidReading.bpm, 0.3),
      spo2: this.smoothValue(vitals.spo2, this.lastValidReading.spo2, 0.4),
      systolic: this.smoothValue(vitals.systolic, this.lastValidReading.systolic, 0.5),
      diastolic: this.smoothValue(vitals.diastolic, this.lastValidReading.diastolic, 0.5)
    };
  }

  private smoothValue(current: number, previous: number, factor: number): number {
    if (current === 0) return previous;
    if (previous === 0) return current;
    return current * factor + previous * (1 - factor);
  }

  private getEmptyReading(): VitalSigns {
    return {
      bpm: 0,
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      quality: 0,
      hasArrhythmia: false,
      arrhythmiaType: 'Normal'
    };
  }
}
