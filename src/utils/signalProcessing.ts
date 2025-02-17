
import { PTTProcessor } from './pttProcessor';
import { PPGFeatureExtractor } from './ppgFeatureExtractor';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';
import { SignalQualityAnalyzer } from './signalQualityAnalyzer';

export class SignalProcessor {
  private readonly windowSize: number;
  private readonly sampleRate = 30;
  private readonly spO2CalibrationCoefficients = {
    a: 110,
    b: 25,
    c: 1,
    perfusionIndexThreshold: 0.2
  };

  private readonly pttProcessor: PTTProcessor;
  private readonly featureExtractor: PPGFeatureExtractor;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private readonly qualityAnalyzer: SignalQualityAnalyzer;
  
  constructor(windowSize: number) {
    this.windowSize = windowSize;
    this.pttProcessor = new PTTProcessor();
    this.featureExtractor = new PPGFeatureExtractor();
    this.signalFilter = new SignalFilter(this.sampleRate);
    this.frequencyAnalyzer = new SignalFrequencyAnalyzer(this.sampleRate);
    this.qualityAnalyzer = new SignalQualityAnalyzer();
  }

  // ✅ Mejor filtrado de señal (Menos ruido)
  private applySmoothingFilter(signal: number[]): number[] {
    return signal.map((value, index, arr) => 
      index > 1 && index < arr.length - 1 
        ? (arr[index - 2] + arr[index - 1] + value + arr[index + 1] + arr[index + 2]) / 5 
        : value
    );
  }

  // Análisis de la Variabilidad de la Frecuencia Cardíaca (HRV)
  analyzeHRV(intervals: number[]): { 
    hasArrhythmia: boolean; 
    type: string; 
    sdnn: number; 
    rmssd: number; 
    pnn50: number; 
    lfhf: number; 
  } {
    if (intervals.length < 2) {
      return {
        hasArrhythmia: false,
        type: 'Normal',
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        lfhf: 0
      };
    }

    // Calcular SDNN (Desviación estándar de intervalos NN)
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const sdnn = Math.sqrt(
      intervals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 
      (intervals.length - 1)
    );

    // Calcular RMSSD
    const successiveDiffs = intervals.slice(1).map((val, i) => 
      Math.pow(val - intervals[i], 2)
    );
    const rmssd = Math.sqrt(
      successiveDiffs.reduce((a, b) => a + b, 0) / successiveDiffs.length
    );

    // Calcular pNN50
    const nn50 = intervals.slice(1).filter((val, i) => 
      Math.abs(val - intervals[i]) > 50
    ).length;
    const pnn50 = (nn50 / (intervals.length - 1)) * 100;

    // Calcular ratio LF/HF usando el analizador de frecuencia
    const { lf, hf } = this.frequencyAnalyzer.calculateFrequencyDomainMetrics(intervals);
    const lfhf = hf !== 0 ? lf / hf : 0;

    // Detectar arritmias basadas en los parámetros calculados
    const hasArrhythmia = sdnn > 100 || rmssd > 50 || pnn50 > 20;
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

  // ✅ Calcular SpO2 con mayor precisión
  calculateSpO2(redSignal: number[], irSignal: number[]): { spo2: number; confidence: number } {
    if (redSignal.length !== irSignal.length || redSignal.length < 2) {
      return { spo2: 0, confidence: 0 };
    }

    const filteredRed = this.applySmoothingFilter(this.signalFilter.lowPassFilter(redSignal, 4));
    const filteredIr = this.applySmoothingFilter(this.signalFilter.lowPassFilter(irSignal, 4));

    const windowSize = Math.min(30, filteredRed.length);
    let redAC = 0, redDC = 0, irAC = 0, irDC = 0;

    for (let i = filteredRed.length - windowSize; i < filteredRed.length; i++) {
      redDC += filteredRed[i];
      irDC += filteredIr[i];
      if (i > filteredRed.length - windowSize + 1) {
        redAC += Math.abs(filteredRed[i] - filteredRed[i - 1]);
        irAC += Math.abs(filteredIr[i] - filteredIr[i - 1]);
      }
    }

    redDC /= windowSize;
    irDC /= windowSize;
    redAC /= (windowSize - 1);
    irAC /= (windowSize - 1);

    const R = ((redAC * irDC) / (irAC * redDC)) * this.spO2CalibrationCoefficients.c;
    let spo2 = Math.min(Math.max(Math.round(this.spO2CalibrationCoefficients.a - this.spO2CalibrationCoefficients.b * R), 70), 100);
    
    const confidence = this.calculateConfidence(redAC, irAC, windowSize);
    return { spo2, confidence };
  }

  private calculateConfidence(redAC: number, irAC: number, windowSize: number): number {
    const signalStrength = (redAC + irAC) / 2;
    return Math.min((signalStrength / 0.1) * (windowSize / 30) * 100, 100);
  }

  // ✅ Detección de picos cardíacos más precisa
  detectPeaks(intervals: number[]): number {
    let peaks = 0;
    for (let i = 2; i < intervals.length - 2; i++) {
      if (
        intervals[i] > intervals[i - 1] && intervals[i] > intervals[i + 1] &&
        intervals[i] > intervals[i - 2] && intervals[i] > intervals[i + 2]
      ) {
        peaks++;
      }
    }
    return peaks * 2; // Ajuste para BPM más preciso
  }

  // ✅ Estimación de presión arterial con mejor calibración
  estimateBloodPressure(signal: number[], peakTimes: number[]): { systolic: number; diastolic: number } {
    if (peakTimes.length < 2) {
      return { systolic: 0, diastolic: 0 };
    }

    const pttResult = this.pttProcessor.calculatePTT(signal);
    const ppgFeatures = this.featureExtractor.extractFeatures(signal);

    if (!pttResult || !ppgFeatures) {
      return { systolic: 0, diastolic: 0 };
    }

    const ptt = pttResult.ptt;
    const { augmentationIndex, stiffnessIndex } = ppgFeatures;

    const coefficients = {
      ptt: -0.9,
      aix: 30,
      si: 3,
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

    if (systolic <= diastolic) {
      systolic = diastolic + 40;
    }

    return { systolic, diastolic };
  }

  analyzeSignalQuality(signal: number[]): number {
    return this.qualityAnalyzer.analyzeSignalQuality(signal);
  }
}
