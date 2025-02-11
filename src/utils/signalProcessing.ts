
import FFT from 'fft.js';
import { PTTProcessor } from './pttProcessor';
import { PPGFeatureExtractor } from './ppgFeatureExtractor';

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

  // Estado del filtro de Kalman
  private kalmanState = {
    x: 0, // Estimación del estado
    p: 1, // Covarianza del error de estimación
    q: 0.1, // Ruido del proceso
    r: 1 // Ruido de la medición
  };

  private readonly pttProcessor: PTTProcessor;
  private readonly featureExtractor: PPGFeatureExtractor;
  
  constructor(windowSize: number) {
    this.windowSize = windowSize;
    this.pttProcessor = new PTTProcessor();
    this.featureExtractor = new PPGFeatureExtractor();
  }

  updateCalibrationConstants(calibrationData: any) {
    this.calibrationConstants = calibrationData.calibration_constants || {};
    
    // Actualizar coeficientes de SpO2 si están disponibles
    if (calibrationData.spo2_calibration_data) {
      const spo2Cal = calibrationData.spo2_calibration_data;
      this.spO2CalibrationCoefficients.a = spo2Cal.a || 110;
      this.spO2CalibrationCoefficients.b = spo2Cal.b || 25;
      this.spO2CalibrationCoefficients.c = spo2Cal.c || 1;
    }
  }

  lowPassFilter(signal: number[], cutoffFreq: number): number[] {
    // Primero aplicamos el filtro de Kalman
    const kalmanFiltered = signal.map(value => this.kalmanFilter(value));
    
    // Luego aplicamos el filtro paso bajo existente
    const filtered: number[] = [];
    const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
    const dt = 1.0 / this.sampleRate;
    const alpha = dt / (rc + dt);
    const windowSize = Math.min(10, signal.length);
    
    // Aplicar ventana Hamming
    for (let i = 0; i < kalmanFiltered.length; i++) {
      let sum = 0;
      let weightSum = 0;
      
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        const weight = 0.54 - 0.46 * Math.cos((2 * Math.PI * (j - i + windowSize)) / windowSize);
        sum += kalmanFiltered[j] * weight;
        weightSum += weight;
      }
      
      filtered[i] = sum / weightSum;
    }
    
    // Aplicar filtro RC adicional
    let lastFiltered = filtered[0];
    for (let i = 1; i < signal.length; i++) {
      lastFiltered = lastFiltered + alpha * (filtered[i] - lastFiltered);
      filtered[i] = lastFiltered;
    }
    
    return filtered;
  }

  private kalmanFilter(measurement: number): number {
    // Predicción
    const predictedState = this.kalmanState.x;
    const predictedCovariance = this.kalmanState.p + this.kalmanState.q;

    // Ganancia de Kalman
    const kalmanGain = predictedCovariance / (predictedCovariance + this.kalmanState.r);

    // Actualización
    this.kalmanState.x = predictedState + kalmanGain * (measurement - predictedState);
    this.kalmanState.p = (1 - kalmanGain) * predictedCovariance;

    return this.kalmanState.x;
  }

  updateKalmanParameters(q: number, r: number) {
    this.kalmanState.q = q;
    this.kalmanState.r = r;
  }

  performFFT(signal: number[]): { frequencies: number[], magnitudes: number[] } {
    const fft = new FFT(Math.pow(2, Math.ceil(Math.log2(Math.max(signal.length, 2)))));
    const phasors = fft.createComplexArray();
    const paddedSignal = [...signal];
    while (paddedSignal.length < fft.size) {
      paddedSignal.push(0);
    }
    
    // Aplicar ventana Hanning para reducir el efecto de fuga espectral
    for (let i = 0; i < paddedSignal.length; i++) {
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (paddedSignal.length - 1)));
      paddedSignal[i] *= hann;
    }
    
    fft.realTransform(phasors, paddedSignal);
    
    const frequencies: number[] = [];
    const magnitudes: number[] = [];
    
    // Análisis de frecuencias relevantes para el ritmo cardíaco (0.5-4 Hz)
    const minFreqIdx = Math.floor(0.5 * fft.size / this.sampleRate);
    const maxFreqIdx = Math.ceil(4 * fft.size / this.sampleRate);
    
    for (let i = minFreqIdx; i < maxFreqIdx; i++) {
      frequencies.push((i * this.sampleRate) / fft.size);
      // Calcular magnitud con corrección de amplitud
      magnitudes.push(2 * Math.sqrt(phasors[2*i]**2 + phasors[2*i+1]**2) / fft.size);
    }
    
    return { frequencies, magnitudes };
  }

  calculateSpO2(redSignal: number[], irSignal: number[], perfusionIndex: number = 0): {
    spo2: number;
    confidence: number;
  } {
    if (redSignal.length !== irSignal.length || redSignal.length < 2) {
      return { spo2: 0, confidence: 0 };
    }
    
    // Aplicar filtro paso bajo para reducir ruido
    const filteredRed = this.lowPassFilter(redSignal, 4);
    const filteredIr = this.lowPassFilter(irSignal, 4);
    
    // Calcular AC y DC para ambas señales usando ventana deslizante
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
    
    // Calcular R (ratio-of-ratios) con corrección de temperatura
    const R = ((redAC * irDC) / (irAC * redDC)) * this.spO2CalibrationCoefficients.c;
    
    // Calcular SpO2 usando ecuación calibrada
    let spo2 = Math.round(this.spO2CalibrationCoefficients.a - 
                         this.spO2CalibrationCoefficients.b * R);
    
    // Calcular puntuación de confianza basada en múltiples factores
    let confidence = 1.0;
    
    // Ajustar por índice de perfusión
    if (perfusionIndex < this.spO2CalibrationCoefficients.perfusionIndexThreshold) {
      confidence *= (perfusionIndex / this.spO2CalibrationCoefficients.perfusionIndexThreshold);
    }
    
    // Ajustar por variabilidad de la señal
    const signalStability = this.calculateSignalStability(filteredRed, filteredIr);
    confidence *= signalStability;
    
    // Limitar SpO2 a rangos fisiológicamente posibles
    spo2 = Math.min(Math.max(spo2, 70), 100);
    
    // Normalizar confianza a porcentaje
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

    // Cálculo de métricas temporales de HRV
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // SDNN (Standard Deviation of NN intervals)
    const sdnn = Math.sqrt(
      intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (intervals.length - 1)
    );
    
    // RMSSD (Root Mean Square of Successive Differences)
    let successiveDiff = 0;
    let nn50 = 0; // Número de intervalos sucesivos que difieren por más de 50ms
    for (let i = 1; i < intervals.length; i++) {
      const diff = Math.abs(intervals[i] - intervals[i-1]);
      successiveDiff += Math.pow(diff, 2);
      if (diff > 50) nn50++;
    }
    const rmssd = Math.sqrt(successiveDiff / (intervals.length - 1));
    
    // pNN50 (Porcentaje de intervalos NN que difieren por más de 50ms)
    const pnn50 = (nn50 / (intervals.length - 1)) * 100;
    
    // Análisis en el dominio de la frecuencia
    const { lf, hf } = this.calculateFrequencyDomainMetrics(intervals);
    const lfhf = lf / hf; // Ratio LF/HF
    
    // Detección avanzada de arritmias
    let hasArrhythmia = false;
    let type = 'Normal';
    
    if (sdnn > 100 || rmssd > 50) {
      hasArrhythmia = true;
      
      if (pnn50 > 40 && lfhf > 2) {
        type = 'Fibrilación Auricular';
      } else if (sdnn > 150 && rmssd < 30) {
        type = 'Taquicardia Ventricular';
      } else if (mean > 1000 && pnn50 < 10) { // Intervalos largos, baja variabilidad
        type = 'Bradicardia Sinusal';
      } else if (mean < 600 && lfhf > 3) { // Intervalos cortos, predominio simpático
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
    
    // Get PTT and PPG features
    const pttResult = this.pttProcessor.calculatePTT(signal);
    const ppgFeatures = this.featureExtractor.extractFeatures(signal);
    
    if (!pttResult || !ppgFeatures) {
      return { systolic: 0, diastolic: 0 };
    }

    // Enhanced BP estimation using PTT and PPG features
    const ptt = pttResult.ptt;
    const { augmentationIndex, stiffnessIndex } = ppgFeatures;

    // BP estimation coefficients (these would ideally come from calibration)
    const coefficients = {
      ptt: -0.5,      // PTT coefficient (inverse relationship)
      aix: 20,        // Augmentation Index coefficient
      si: 2,          // Stiffness Index coefficient
      baselineSys: 120,
      baselineDia: 80
    };

    // Calculate systolic pressure using multiple features
    const systolic = Math.round(
      coefficients.baselineSys +
      (coefficients.ptt * (1000/ptt - 5)) +
      (coefficients.aix * augmentationIndex) +
      (coefficients.si * stiffnessIndex)
    );

    // Calculate diastolic pressure
    const diastolic = Math.round(
      coefficients.baselineDia +
      (coefficients.ptt * (1000/ptt - 5) * 0.8) +
      (coefficients.aix * augmentationIndex * 0.6) +
      (coefficients.si * stiffnessIndex * 0.5)
    );

    // Ensure values are within physiological limits
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
    // Use calibration data to improve BP estimation
    const baseBP = this.estimateBloodPressure(signal, peakTimes);
    const calibrationFactor = this.calculateCalibrationFactor(calibrationData);
    
    return {
      systolic: Math.round(baseBP.systolic * calibrationFactor),
      diastolic: Math.round(baseBP.diastolic * calibrationFactor)
    };
  }

  private calculateCalibrationFactor(calibrationData: any): number {
    // Simple calibration factor based on reference values
    const referenceSystolic = calibrationData.systolic || 120;
    const estimatedSystolic = 120; // Default estimation
    return referenceSystolic / estimatedSystolic;
  }

  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    // Calcular SNR (Signal-to-Noise Ratio)
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Análisis de ruido
    const noiseLevel = this.calculateNoiseLevel(signal);
    
    // Calcular calidad basada en múltiples factores
    const snrQuality = Math.min(standardDeviation / mean, 1);
    const noiseQuality = Math.max(1 - noiseLevel, 0);
    
    // Combinar métricas de calidad
    const quality = (snrQuality + noiseQuality) / 2;
    
    return Math.min(Math.max(quality, 0), 1);
  }

  private calculateRRVariability(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    
    const differences = [];
    for (let i = 1; i < intervals.length; i++) {
      differences.push(Math.abs(intervals[i] - intervals[i-1]));
    }
    
    const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    return meanDiff / (intervals.reduce((a, b) => a + b, 0) / intervals.length);
  }

  private extractWaveformFeatures(signal: number[]): {
    systolicPeak: number;
    diastolicPeak: number;
    dicroticNotchTime: number;
    augmentationIndex: number;
  } {
    const systolicPeak = Math.max(...signal);
    let diastolicPeak = 0;
    let dicroticNotchTime = 0;
    let notchValue = 0;
    
    // Buscar el dicrotic notch y pico diastólico
    for (let i = signal.indexOf(systolicPeak); i < signal.length - 1; i++) {
      if (signal[i] < signal[i+1] && signal[i] < signal[i-1]) {
        notchValue = signal[i];
        dicroticNotchTime = i;
        break;
      }
    }
    
    // Buscar el pico diastólico después del dicrotic notch
    if (dicroticNotchTime > 0) {
      diastolicPeak = Math.max(...signal.slice(dicroticNotchTime));
    }
    
    // Calcular el índice de aumentación
    const augmentationIndex = diastolicPeak > 0 ? 
      ((systolicPeak - notchValue) / (systolicPeak - diastolicPeak)) : 0;
    
    return {
      systolicPeak,
      diastolicPeak,
      dicroticNotchTime,
      augmentationIndex
    };
  }

  private calculateNoiseLevel(signal: number[]): number {
    // Calcular diferencias consecutivas para estimar ruido
    const differences = [];
    for (let i = 1; i < signal.length; i++) {
      differences.push(Math.abs(signal[i] - signal[i-1]));
    }
    
    const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const maxSignal = Math.max(...signal) - Math.min(...signal);
    
    return meanDiff / maxSignal;
  }

  private calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    const redVariance = this.calculateVariance(redSignal);
    const irVariance = this.calculateVariance(irSignal);
    
    // Normalizar varianzas y convertir a medida de estabilidad
    const maxVariance = Math.max(redVariance, irVariance);
    if (maxVariance === 0) return 1.0;
    
    const stabilityScore = 1.0 - (Math.min(maxVariance, 1000) / 1000);
    return Math.max(stabilityScore, 0.1);
  }

  private calculateVariance(signal: number[]): number {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    return signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
  }

  private calculateFrequencyDomainMetrics(intervals: number[]): { lf: number; hf: number } {
    // Remuestreo de los intervalos RR a una frecuencia constante
    const samplingRate = 4; // Hz
    const interpolatedSignal = this.interpolateRRIntervals(intervals, samplingRate);
    
    // Aplicar FFT
    const fft = new FFT(Math.