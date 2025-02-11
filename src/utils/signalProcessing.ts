
import { PTTProcessor } from './pttProcessor';
import { PPGFeatureExtractor } from './ppgFeatureExtractor';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';
import { SignalQualityAnalyzer } from './signalQualityAnalyzer';

export class SignalProcessor {
  private readonly windowSize: number;
  private calibrationConstants: any = {};
  private readonly sampleRate = 30;
  private readonly spO2CalibrationCoefficients = {
    a: 110,
    b: 25,
    c: 1,
    perfusionIndexThreshold: 0.4
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

  updateCalibrationConstants(calibrationData: any) {
    this.calibrationConstants = calibrationData.calibration_constants || {};
    
    if (calibrationData.spo2_calibration_data) {
      const spo2Cal = calibrationData.spo2_calibration_data;
      this.spO2CalibrationCoefficients.a = spo2Cal.a || 110;
      this.spO2CalibrationCoefficients.b = spo2Cal.b || 25;
      this.spO2CalibrationCoefficients.c = spo2Cal.c || 1;
    }
  }

  calculateSpO2(redSignal: number[], irSignal: number[], perfusionIndex: number = 0): {
    spo2: number;
    confidence: number;
  } {
    if (redSignal.length !== irSignal.length || redSignal.length < 2) {
      return { spo2: 0, confidence: 0 };
    }
    
    const filteredRed = this.signalFilter.lowPassFilter(redSignal, 4);
    const filteredIr = this.signalFilter.lowPassFilter(irSignal, 4);
    
    const windowSize = Math.min(30, filteredRed.length);
    let redAC = 0, redDC = 0, irAC = 0, irDC = 0;
    
    for (let i = filteredRed.length - windowSize; i < filteredRed.length; i++) {
      redDC += filteredRed[i];
      irDC += filteredIr[i];
      
      if (i > filteredRed.length - windowSize + 1) {
        redAC += Math.abs(filteredRed[i] - filteredRed[i-1]);
        irAC += Math.abs(filteredIr[i] - filteredIr[i-1]);
      }
    }
    
    redDC /= windowSize;
    irDC /= windowSize;
    redAC /= (windowSize - 1);
    irAC /= (windowSize - 1);
    
    const R = ((redAC * irDC) / (irAC * redDC)) * this.spO2CalibrationCoefficients.c;
    let spo2 = Math.round(this.spO2CalibrationCoefficients.a - 
                         this.spO2CalibrationCoefficients.b * R);
    
    let confidence = 1.0;
    
    if (perfusionIndex < this.spO2CalibrationCoefficients.perfusionIndexThreshold) {
      confidence *= (perfusionIndex / this.spO2CalibrationCoefficients.perfusionIndexThreshold);
    }
    
    const signalStability = this.qualityAnalyzer.calculateSignalStability(filteredRed, filteredIr);
    confidence *= signalStability;
    
    spo2 = Math.min(Math.max(spo2, 70), 100);
    confidence = Math.min(Math.max(confidence * 100, 0), 100);
    
    return { spo2, confidence };
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
      intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (intervals.length - 1)
    );
    
    let successiveDiff = 0;
    let nn50 = 0;
    for (let i = 1; i < intervals.length; i++) {
      const diff = Math.abs(intervals[i] - intervals[i-1]);
      successiveDiff += Math.pow(diff, 2);
      if (diff > 50) nn50++;
    }
    const rmssd = Math.sqrt(successiveDiff / (intervals.length - 1));
    const pnn50 = (nn50 / (intervals.length - 1)) * 100;
    
    const { lf, hf } = this.frequencyAnalyzer.calculateFrequencyDomainMetrics(intervals);
    const lfhf = lf / hf;
    
    let hasArrhythmia = false;
    let type = 'Normal';
    
    if (sdnn > 100 || rmssd > 50) {
      hasArrhythmia = true;
      
      if (pnn50 > 40 && lfhf > 2) {
        type = 'Fibrilación Auricular';
      } else if (sdnn > 150 && rmssd < 30) {
        type = 'Taquicardia Ventricular';
      } else if (mean > 1000 && pnn50 < 10) {
        type = 'Bradicardia Sinusal';
      } else if (mean < 600 && lfhf > 3) {
        type = 'Taquicardia Sinusal';
      }
    }

    return { hasArrhythmia, type, sdnn, rmssd, pnn50, lfhf };
  }

  estimateBloodPressure(signal: number[], peakTimes: number[]): { 
    systolic: number;
    diastolic: number;
  } {
    if (peakTimes.length < 2) return { systolic: 0, diastolic: 0 };
    
    const pttResult = this.pttProcessor.calculatePTT(signal);
    const ppgFeatures = this.featureExtractor.extractFeatures(signal);
    
    if (!pttResult || !ppgFeatures) {
      return { systolic: 0, diastolic: 0 };
    }

    const ptt = pttResult.ptt;
    const { augmentationIndex, stiffnessIndex } = ppgFeatures;

    const coefficients = {
      ptt: -0.5,
      aix: 20,
      si: 2,
      baselineSys: 120,
      baselineDia: 80
    };

    const systolic = Math.round(
      coefficients.baselineSys +
      (coefficients.ptt * (1000/ptt - 5)) +
      (coefficients.aix * augmentationIndex) +
      (coefficients.si * stiffnessIndex)
    );

    const diastolic = Math.round(
      coefficients.baselineDia +
      (coefficients.ptt * (1000/ptt - 5) * 0.8) +
      (coefficients.aix * augmentationIndex * 0.6) +
      (coefficients.si * stiffnessIndex * 0.5)
    );

    return {
      systolic: Math.min(Math.max(systolic, 90), 180),
      diastolic: Math.min(Math.max(diastolic, 60), 120)
    };
  }

  estimateBloodPressureWithCalibration(
    signal: number[], 
    peakTimes: number[],
    calibrationData: any
  ): { 
    systolic: number;
    diastolic: number;
  } {
    const baseBP = this.estimateBloodPressure(signal, peakTimes);
    const calibrationFactor = this.calculateCalibrationFactor(calibrationData);
    
    return {
      systolic: Math.round(baseBP.systolic * calibrationFactor),
      diastolic: Math.round(baseBP.diastolic * calibrationFactor)
    };
  }

  private calculateCalibrationFactor(calibrationData: any): number {
    const referenceSystolic = calibrationData.systolic || 120;
    const estimatedSystolic = 120;
    return referenceSystolic / estimatedSystolic;
  }

  analyzeSignalQuality(signal: number[]): number {
    return this.qualityAnalyzer.analyzeSignalQuality(signal);
  }
}

