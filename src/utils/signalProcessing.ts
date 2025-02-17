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

  // ✅ Calcular SpO2 con mayor precisión
  calculateSpO2(redSignal: number[], irSignal: number[]): { spo2: number; confidence: number } {
    console.log('💉 Calculando SpO2:', { muestrasRojas: redSignal.length, muestrasIR: irSignal.length });

    if (redSignal.length !== irSignal.length || redSignal.length < 2) {
      console.log('⚠️ Muestras insuficientes para SpO2');
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
    console.log('🩺 Estimando presión arterial');

    if (peakTimes.length < 2) {
      console.log('⚠️ Picos insuficientes para BP');
      return { systolic: 0, diastolic: 0 };
    }

    const pttResult = this.pttProcessor.calculatePTT(signal);
    const ppgFeatures = this.featureExtractor.extractFeatures(signal);

    if (!pttResult || !ppgFeatures) {
      console.log('⚠️ No se pudo calcular PTT o extraer características');
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
