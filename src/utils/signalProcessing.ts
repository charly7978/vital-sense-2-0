// ==================== SignalProcessor.ts ====================

import { PTTProcessor } from './pttProcessor';
import { PPGFeatureExtractor } from './ppgFeatureExtractor';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';
import { SignalQualityAnalyzer } from './signalQualityAnalyzer';

export class SignalProcessor {
  private readonly windowSize: number;
  private readonly sampleRate = 30; // Optimizado para móviles
  private readonly spO2CalibrationCoefficients = {
    a: 110,
    b: 25,
    c: 1.8, // Ajustado para mejor precisión
    perfusionIndexThreshold: 0.5
  };

  private readonly pttProcessor: PTTProcessor;
  private readonly featureExtractor: PPGFeatureExtractor;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private readonly qualityAnalyzer: SignalQualityAnalyzer;
  
  constructor(windowSize: number = 360) { // 12 segundos a 30fps
    this.windowSize = windowSize;
    this.pttProcessor = new PTTProcessor();
    this.featureExtractor = new PPGFeatureExtractor();
    this.signalFilter = new SignalFilter(this.sampleRate);
    this.frequencyAnalyzer = new SignalFrequencyAnalyzer(this.sampleRate);
    this.qualityAnalyzer = new SignalQualityAnalyzer();
  }

  analyzeHRV(intervals: number[]): { 
    hasArrhythmia: boolean; 
    type: string; 
    sdnn: number; 
    rmssd: number; 
    pnn50: number; 
    lfhf: number; 
  } {
    if (intervals.length < 4) { // Mínimo 4 intervalos para análisis
      return {
        hasArrhythmia: false,
        type: 'Normal',
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        lfhf: 0
      };
    }

    // Filtrar outliers
    const filteredIntervals = this.removeOutliers(intervals);
    
    const mean = filteredIntervals.reduce((a, b) => a + b, 0) / filteredIntervals.length;
    const sdnn = Math.sqrt(
      filteredIntervals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 
      (filteredIntervals.length - 1)
    );

    const successiveDiffs = filteredIntervals.slice(1).map((val, i) => 
      Math.pow(val - filteredIntervals[i], 2)
    );
    const rmssd = Math.sqrt(
      successiveDiffs.reduce((a, b) => a + b, 0) / successiveDiffs.length
    );

    const nn50 = filteredIntervals.slice(1).filter((val, i) => 
      Math.abs(val - filteredIntervals[i]) > 50
    ).length;
    const pnn50 = (nn50 / (filteredIntervals.length - 1)) * 100;

    const { lf, hf } = this.frequencyAnalyzer.calculateFrequencyDomainMetrics(filteredIntervals);
    const lfhf = hf !== 0 ? lf / hf : 0;

    // Umbrales ajustados para 12 segundos de medición
    const hasArrhythmia = (
      sdnn > 120 && 
      rmssd > 60 && 
      pnn50 > 25 && 
      filteredIntervals.length >= 8
    );

    let type = 'Normal';
    if (hasArrhythmia) {
      if (sdnn > 150 && rmssd > 70) {
        type = 'Fibrilación Auricular';
      } else if (pnn50 > 30) {
        type = 'Arritmia Sinusal';
      } else {
        type = 'Arritmia No Específica';
      }
    }

    return {
      hasArrhythmia,
      type,
      sdnn,
      rmssd,
      pnn50,
      lfhf
    };
  }

  private removeOutliers(intervals: number[]): number[] {
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const std = Math.sqrt(
      intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length
    );
    
    return intervals.filter(val => 
      Math.abs(val - mean) <= 2.5 * std
    );
  }

  calculateSpO2(redSignal: number[], irSignal: number[]): { spo2: number; confidence: number } {
    if (redSignal.length !== irSignal.length || redSignal.length < 4) {
      return { spo2: 0, confidence: 0 };
    }

    // Filtrado optimizado para móviles
    const filteredRed = this.signalFilter.bandPassFilter(redSignal, 0.5, 4.0);
    const filteredIr = this.signalFilter.bandPassFilter(irSignal, 0.5, 4.0);

    const windowSize = Math.min(30, filteredRed.length);
    let redAC = 0, redDC = 0, irAC = 0, irDC = 0;
    const perfusionIndices: number[] = [];

    for (let i = filteredRed.length - windowSize; i < filteredRed.length; i++) {
      const redACTemp = Math.abs(filteredRed[i] - (i > 0 ? filteredRed[i-1] : filteredRed[i]));
      const irACTemp = Math.abs(filteredIr[i] - (i > 0 ? filteredIr[i-1] : filteredIr[i]));
      
      redAC += redACTemp;
      irAC += irACTemp;
      redDC += filteredRed[i];
      irDC += filteredIr[i];

      const perfusionIndex = (redACTemp / filteredRed[i]) * 100;
      perfusionIndices.push(perfusionIndex);
    }

    redDC /= windowSize;
    irDC /= windowSize;
    redAC /= windowSize;
    irAC /= windowSize;

    const R = ((redAC * irDC) / (irAC * redDC)) * this.spO2CalibrationCoefficients.c;
    let spo2 = this.spO2CalibrationCoefficients.a - 
               (this.spO2CalibrationCoefficients.b * Math.pow(R, 1.1));

    spo2 = Math.min(Math.max(Math.round(spo2), 70), 100);

    const avgPerfusionIndex = perfusionIndices.reduce((a, b) => a + b, 0) / perfusionIndices.length;
    const signalStability = this.calculateSignalStability(perfusionIndices);
    
    // Ajuste de confianza más estricto
    const confidence = Math.min(
      (avgPerfusionIndex / this.spO2CalibrationCoefficients.perfusionIndexThreshold) * 
      Math.pow(signalStability, 1.2) * 100, 
      100
    );

    return { spo2, confidence };
  }

  private calculateSignalStability(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.exp(-variance / (2 * Math.pow(mean, 2)));
  }

  detectPeaks(intervals: number[]): number {
    if (intervals.length < 4) return 0;

    let peaks = 0;
    let threshold = 0;
    const minPeakDistance = Math.floor(this.sampleRate * 0.4); // Aumentado para mejor detección
    let lastPeakIndex = -minPeakDistance;

    // Filtrar outliers antes de calcular estadísticas
    const filteredIntervals = this.removeOutliers(intervals);
    
    const mean = filteredIntervals.reduce((a, b) => a + b, 0) / filteredIntervals.length;
    const stdDev = Math.sqrt(
      filteredIntervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / filteredIntervals.length
    );
    
    // Umbral adaptativo más robusto
    threshold = mean + 0.5 * stdDev;

    for (let i = 2; i < intervals.length - 2; i++) {
      if (
        i - lastPeakIndex >= minPeakDistance &&
        intervals[i] > threshold &&
        intervals[i] > intervals[i - 1] &&
        intervals[i] > intervals[i + 1] &&
        intervals[i] > intervals[i - 2] &&
        intervals[i] > intervals[i + 2]
      ) {
        // Validación adicional de forma de pico
        const peakShape = this.validatePeakShape(intervals, i);
        if (peakShape > 0.7) {
          peaks++;
          lastPeakIndex = i;
          
          // Actualización de umbral local más robusta
          const localMean = intervals
            .slice(Math.max(0, i - 5), Math.min(intervals.length, i + 6))
            .reduce((a, b) => a + b, 0) / 11;
          threshold = localMean * 0.8;
        }
      }
    }

    const timeWindow = intervals.length / this.sampleRate;
    const bpm = (peaks * 60) / timeWindow;

    return Math.min(Math.max(Math.round(bpm), 40), 200);
  }

  private validatePeakShape(signal: number[], peakIndex: number): number {
    const windowSize = 5;
    const leftSide = signal.slice(Math.max(0, peakIndex - windowSize), peakIndex);
    const rightSide = signal.slice(peakIndex + 1, Math.min(signal.length, peakIndex + windowSize + 1));

    // Verificar pendiente ascendente
    let ascendingScore = 0;
    for (let i = 1; i < leftSide.length; i++) {
      if (leftSide[i] > leftSide[i-1]) ascendingScore++;
    }

    // Verificar pendiente descendente
    let descendingScore = 0;
    for (let i = 1; i < rightSide.length; i++) {
      if (rightSide[i] < rightSide[i-1]) descendingScore++;
    }

    return (ascendingScore + descendingScore) / (leftSide.length + rightSide.length - 2);
  }

  estimateBloodPressure(signal: number[], peakTimes: number[]): { systolic: number; diastolic: number } {
    if (peakTimes.length < 4) {
      return { systolic: 0, diastolic: 0 };
    }

    const pttResult = this.pttProcessor.calculatePTT(signal);
    const ppgFeatures = this.featureExtractor.extractFeatures(signal);

    if (!pttResult || !ppgFeatures) {
      return { systolic: 0, diastolic: 0 };
    }

    const ptt = pttResult.ptt;
    const { augmentationIndex, stiffnessIndex } = ppgFeatures;

    // Coeficientes ajustados para mejor precisión
    const coefficients = {
      ptt: -0.95,
      aix: 32,
      si: 3.2,
      baselineSys: 120,
      baselineDia: 80
    };

    let systolic = Math.min(Math.max(Math.round(
      coefficients.baselineSys +
      (coefficients.ptt * (1000 / ptt - 5)) +
      (coefficients.aix * augmentationIndex) +
      (coefficients.si * stiffnessIndex)
    ), 90), 180);

    let diastolic = Math.min(Math.max(Math.round(
      coefficients.baselineDia +
      (coefficients.ptt * (1000 / ptt - 5) * 0.8) +
      (coefficients.aix * augmentationIndex * 0.6) +
      (coefficients.si * stiffnessIndex * 0.5)
    ), 60), 120);

    // Validación adicional
    if (systolic <= diastolic + 30) {
      systolic = diastolic + 40;
    }

    return { systolic, diastolic };
  }

  analyzeSignalQuality(signal: number[]): number {
    return this.qualityAnalyzer.analyzeSignalQuality(signal);
  }
}
