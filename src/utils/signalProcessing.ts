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
    c: 1.5,
    perfusionIndexThreshold: 0.3
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

  private applySmoothingFilter(signal: number[]): number[] {
    const windowSize = 5;
    const halfWindow = Math.floor(windowSize / 2);
    const smoothed = [...signal];

    for (let i = halfWindow; i < signal.length - halfWindow; i++) {
      let sum = 0;
      for (let j = -halfWindow; j <= halfWindow; j++) {
        const coeff = j === 0 ? 0.7 : (j === -1 || j === 1) ? 0.2 : -0.1;
        sum += signal[i + j] * coeff;
      }
      smoothed[i] = sum;
    }

    return smoothed;
  }

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

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const sdnn = Math.sqrt(
      intervals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 
      (intervals.length - 1)
    );

    const successiveDiffs = intervals.slice(1).map((val, i) => 
      Math.pow(val - intervals[i], 2)
    );
    const rmssd = Math.sqrt(
      successiveDiffs.reduce((a, b) => a + b, 0) / successiveDiffs.length
    );

    const nn50 = intervals.slice(1).filter((val, i) => 
      Math.abs(val - intervals[i]) > 50
    ).length;
    const pnn50 = (nn50 / (intervals.length - 1)) * 100;

    const { lf, hf } = this.frequencyAnalyzer.calculateFrequencyDomainMetrics(intervals);
    const lfhf = hf !== 0 ? lf / hf : 0;

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

  calculateSpO2(redSignal: number[], irSignal: number[]): { spo2: number; confidence: number } {
    if (redSignal.length !== irSignal.length || redSignal.length < 2) {
      return { spo2: 0, confidence: 0 };
    }

    let redAC = 0, redDC = 0, irAC = 0, irDC = 0;
    const windowSize = Math.min(30, redSignal.length);

    for (let i = redSignal.length - windowSize; i < redSignal.length; i++) {
      const redACTemp = Math.abs(redSignal[i] - (i > 0 ? redSignal[i-1] : redSignal[i]));
      const irACTemp = Math.abs(irSignal[i] - (i > 0 ? irSignal[i-1] : irSignal[i]));
      
      redAC += redACTemp;
      irAC += irACTemp;
      redDC += redSignal[i];
      irDC += irSignal[i];
    }

    redDC /= windowSize;
    irDC /= windowSize;
    redAC /= windowSize;
    irAC /= windowSize;

    if (irAC === 0 || irDC === 0) return { spo2: 0, confidence: 0 };

    const R = (redAC * irDC) / (irAC * redDC);
    
    if (R < 0.05 || R > 15) {
      return { spo2: 0, confidence: 0 };
    }

    let spo2 = 110 - 25 * R;
    spo2 = Math.min(100, Math.max(70, spo2));

    const confidence = Math.min(
      (redAC / redDC) * 100,
      (irAC / irDC) * 100
    ) / 3;

    if (confidence < 0.1) {
      return { spo2: 0, confidence: 0 };
    }

    return { 
      spo2: Math.round(spo2), 
      confidence: Math.max(0, Math.min(1, confidence))
    };
  }

  private calculateSignalStability(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    return Math.exp(-variance / (2 * Math.pow(mean, 2)));
  }

  detectPeaks(intervals: number[]): number {
    let peaks = 0;
    let threshold = 0;
    const minPeakDistance = Math.floor(this.sampleRate * 0.3); // 300ms mínimo entre picos
    let lastPeakIndex = -minPeakDistance;

    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const stdDev = Math.sqrt(
      intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length
    );
    
    threshold = mean + 0.15 * stdDev;

    for (let i = 2; i < intervals.length - 2; i++) {
      if (
        i - lastPeakIndex >= minPeakDistance &&
        intervals[i] > threshold &&
        intervals[i] > intervals[i - 1] * 1.05 &&
        intervals[i] > intervals[i + 1] * 1.05 &&
        intervals[i] > intervals[i - 2] &&
        intervals[i] > intervals[i + 2]
      ) {
        peaks++;
        lastPeakIndex = i;
        
        const localMean = intervals
          .slice(Math.max(0, i - 5), Math.min(intervals.length, i + 6))
          .reduce((a, b) => a + b, 0) / 11;
        threshold = localMean * 0.4;
      }
    }

    const timeWindow = intervals.length / this.sampleRate;
    const bpm = (peaks * 60) / timeWindow;

    if (peaks > 0 && bpm >= 40 && bpm <= 200) {
      return Math.round(bpm);
    }

    return 0;
  }

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
      ptt: -1.2,
      aix: 35,
      si: 4,
      baselineSys: 120,
      baselineDia: 80
    };

    let systolic = Math.round(
      coefficients.baselineSys +
      (coefficients.ptt * (1000 / ptt - 4)) +
      (coefficients.aix * augmentationIndex) +
      (coefficients.si * stiffnessIndex)
    );

    let diastolic = Math.round(
      coefficients.baselineDia +
      (coefficients.ptt * (1000 / ptt - 4) * 0.7) +
      (coefficients.aix * augmentationIndex * 0.5) +
      (coefficients.si * stiffnessIndex * 0.4)
    );

    systolic = Math.min(Math.max(systolic, 90), 180);
    diastolic = Math.min(Math.max(diastolic, 60), 120);

    if (systolic <= diastolic) {
      const diff = Math.round((systolic - diastolic) * 0.4);
      systolic = diastolic + Math.max(30, diff);
    }

    return { systolic, diastolic };
  }

  analyzeSignalQuality(signal: number[]): number {
    return this.qualityAnalyzer.analyzeSignalQuality(signal);
  }
}
