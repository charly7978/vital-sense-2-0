import FFT from 'fft.js';

export class SignalProcessor {
  private readonly windowSize: number;
  private calibrationConstants: any = {};
  private readonly sampleRate = 30;
  private readonly spO2CalibrationCoefficients = {
    a: 110,  // Coeficiente de calibración empírica
    b: 25,   // Pendiente de calibración empírica
    c: 1,    // Factor de corrección de temperatura
    perfusionIndexThreshold: 0.4  // Umbral mínimo de índice de perfusión
  };

  constructor(windowSize: number) {
    this.windowSize = windowSize;
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
    const filtered = [];
    const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
    const dt = 1.0 / this.sampleRate;
    const alpha = dt / (rc + dt);
    const windowSize = Math.min(10, signal.length);
    
    // Aplicar ventana Hamming para mejorar la respuesta en frecuencia
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let weightSum = 0;
      
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        const weight = 0.54 - 0.46 * Math.cos((2 * Math.PI * (j - i + windowSize)) / windowSize);
        sum += signal[j] * weight;
        weightSum += weight;
      }
      
      filtered[i] = sum / weightSum;
    }
    
    // Aplicar filtro RC adicional para suavizar
    let lastFiltered = filtered[0];
    for (let i = 1; i < signal.length; i++) {
      lastFiltered = lastFiltered + alpha * (filtered[i] - lastFiltered);
      filtered[i] = lastFiltered;
    }
    
    return filtered;
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
    
    // Cálculo mejorado del PTT (Pulse Transit Time)
    const ptts: number[] = [];
    for (let i = 1; i < peakTimes.length; i++) {
      ptts.push(peakTimes[i] - peakTimes[i-1]);
    }
    
    const avgPTT = ptts.reduce((a, b) => a + b, 0) / ptts.length;
    const pttVariability = Math.sqrt(
      ptts.reduce((acc, ptt) => acc + Math.pow(ptt - avgPTT, 2), 0) / ptts.length
    );
    
    // Análisis de la forma de onda PPG
    const waveformFeatures = this.extractWaveformFeatures(signal);
    const { 
      systolicPeak, 
      diastolicPeak, 
      dicroticNotchTime,
      augmentationIndex 
    } = waveformFeatures;
    
    // Modelo predictivo mejorado basado en PTT y características de la onda
    const systolic = Math.round(
      120 + // Línea base
      (1000/avgPTT - 5) * 2.5 + // Contribución del PTT
      augmentationIndex * 0.3 + // Contribución del índice de aumentación
      (pttVariability / avgPTT) * 15 // Variabilidad del PTT
    );
    
    const diastolic = Math.round(
      80 + // Línea base
      (diastolicPeak / systolicPeak - 0.5) * 20 + // Ratio de picos
      dicroticNotchTime * 0.4 + // Tiempo de la muesca dicrótica
      (pttVariability / avgPTT) * 10 // Variabilidad del PTT
    );
    
    // Limitar a rangos fisiológicamente posibles
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
    const fft = new FFT(Math.pow(2, Math.ceil(Math.log2(interpolatedSignal.length))));
    const signal = fft.createComplexArray();
    fft.realTransform(signal, interpolatedSignal);
    
    // Calcular potencia en bandas de frecuencia
    let lfPower = 0; // 0.04-0.15 Hz (Low Frequency)
    let hfPower = 0; // 0.15-0.4 Hz (High Frequency)
    
    const freqResolution = samplingRate / fft.size;
    
    for (let i = 0; i < fft.size/2; i++) {
      const frequency = i * freqResolution;
      const power = Math.sqrt(signal[2*i]**2 + signal[2*i+1]**2);
      
      if (frequency >= 0.04 && frequency < 0.15) {
        lfPower += power;
      } else if (frequency >= 0.15 && frequency < 0.4) {
        hfPower += power;
      }
    }
    
    return { lf: lfPower, hf: hfPower };
  }

  private interpolateRRIntervals(intervals: number[], samplingRate: number): number[] {
    const totalTime = intervals.reduce((a, b) => a + b, 0);
    const numSamples = Math.floor(totalTime * samplingRate / 1000);
    const interpolated = new Array(numSamples).fill(0);
    
    let currentTime = 0;
    let intervalIndex = 0;
    
    for (let i = 0; i < numSamples; i++) {
      const t = (i * 1000) / samplingRate;
      
      while (currentTime + intervals[intervalIndex] < t && intervalIndex < intervals.length - 1) {
        currentTime += intervals[intervalIndex];
        intervalIndex++;
      }
      
      const alpha = (t - currentTime) / intervals[intervalIndex];
      interpolated[i] = intervals[intervalIndex];
    }
    
    return interpolated;
  }
}
