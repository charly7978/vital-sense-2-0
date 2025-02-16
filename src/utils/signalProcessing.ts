
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

  calculateSpO2(redSignal: number[], irSignal: number[]): {
    spo2: number;
    confidence: number;
  } {
    console.log('💉 Calculando SpO2:', {
      muestrasRojas: redSignal.length,
      muestrasIR: irSignal.length
    });

    if (redSignal.length !== irSignal.length || redSignal.length < 2) {
      console.log('⚠️ Muestras insuficientes para SpO2');
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
    
    console.log('📊 Componentes AC/DC:', {
      redAC, redDC, irAC, irDC
    });

    const R = ((redAC * irDC) / (irAC * redDC)) * this.spO2CalibrationCoefficients.c;
    let spo2 = Math.round(this.spO2CalibrationCoefficients.a - 
                         this.spO2CalibrationCoefficients.b * R);
    
    const confidence = this.calculateConfidence(redAC, irAC, windowSize);
    
    console.log('✨ Resultado SpO2:', {
      ratio: R,
      spo2,
      confidence
    });

    spo2 = Math.min(Math.max(spo2, 70), 100);
    
    return { spo2, confidence };
  }

  private calculateConfidence(redAC: number, irAC: number, windowSize: number): number {
    const signalStrength = (redAC + irAC) / 2;
    const normalizedStrength = Math.min(signalStrength / 0.1, 1);
    const confidenceFromWindow = Math.min(windowSize / 30, 1);
    return Math.min(normalizedStrength * confidenceFromWindow * 100, 100);
  }

  analyzeHRV(intervals: number[]): {
    hasArrhythmia: boolean;
    type: string;
    sdnn: number;
    rmssd: number;
    pnn50: number;
    lfhf: number;
  } {
    console.log('💓 Analizando HRV con intervalos:', intervals);

    if (intervals.length < 2) {
      console.log('⚠️ Intervalos insuficientes para HRV');
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
    
    console.log('📊 Métricas HRV:', {
      sdnn, rmssd, pnn50,
      promedio: mean,
      cantidadIntervalos: intervals.length
    });

    const { lf, hf } = this.frequencyAnalyzer.calculateFrequencyDomainMetrics(intervals);
    const lfhf = lf / hf;
    
    let hasArrhythmia = false;
    let type = 'Normal';
    
    // Criterios más sensibles para arritmias
    if (sdnn > 80 || rmssd > 40) {
      hasArrhythmia = true;
      
      if (pnn50 > 30 && lfhf > 2) {
        type = 'Fibrilación Auricular';
      } else if (sdnn > 120 && rmssd < 25) {
        type = 'Taquicardia Ventricular';
      } else if (mean > 1000 && pnn50 < 10) {
        type = 'Bradicardia Sinusal';
      } else if (mean < 600 && lfhf > 3) {
        type = 'Taquicardia Sinusal';
      }
    }

    console.log('❤️ Resultado HRV:', {
      hasArrhythmia,
      type,
      lfhf
    });

    return { hasArrhythmia, type, sdnn, rmssd, pnn50, lfhf };
  }

  estimateBloodPressure(signal: number[], peakTimes: number[]): { 
    systolic: number;
    diastolic: number;
  } {
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

    console.log('📊 Características PPG:', ppgFeatures);

    const ptt = pttResult.ptt;
    const { augmentationIndex, stiffnessIndex } = ppgFeatures;

    const coefficients = {
      ptt: -0.9,
      aix: 30,
      si: 3,
      baselineSys: 120,
      baselineDia: 80
    };

    let systolic = Math.round(
      coefficients.baselineSys +
      (coefficients.ptt * (1000/ptt - 5)) +
      (coefficients.aix * augmentationIndex) +
      (coefficients.si * stiffnessIndex)
    );

    let diastolic = Math.round(
      coefficients.baselineDia +
      (coefficients.ptt * (1000/ptt - 5) * 0.8) +
      (coefficients.aix * augmentationIndex * 0.6) +
      (coefficients.si * stiffnessIndex * 0.5)
    );

    console.log('🩺 BP estimada inicial:', {
      systolic,
      diastolic,
      ptt,
      augmentationIndex,
      stiffnessIndex
    });

    // Ajustar a rangos fisiológicos
    systolic = Math.min(Math.max(systolic, 90), 180);
    diastolic = Math.min(Math.max(diastolic, 60), 120);

    if (systolic <= diastolic) {
      systolic = diastolic + 40;
    }

    console.log('🩺 BP final ajustada:', {
      systolic,
      diastolic
    });

    return { systolic, diastolic };
  }

  analyzeSignalQuality(signal: number[]): number {
    return this.qualityAnalyzer.analyzeSignalQuality(signal);
  }
}
