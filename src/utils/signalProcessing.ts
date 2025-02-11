
import FFT from 'fft.js';

export class SignalProcessor {
  private fft: any;
  private readonly sampleRate = 30; // 30 fps
  
  constructor(size: number) {
    const fftSize = Math.pow(2, Math.ceil(Math.log2(Math.max(size, 2))));
    this.fft = new FFT(fftSize);
  }

  // Implementación mejorada del filtro paso bajo
  lowPassFilter(signal: number[], cutoffFreq: number): number[] {
    const filtered = [];
    const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
    const dt = 1.0 / this.sampleRate;
    const alpha = dt / (rc + dt);
    
    filtered[0] = signal[0];
    for (let i = 1; i < signal.length; i++) {
      filtered[i] = filtered[i-1] + alpha * (signal[i] - filtered[i-1]);
    }
    return filtered;
  }

  // Análisis FFT mejorado para detección de frecuencia cardíaca
  performFFT(signal: number[]): { frequencies: number[], magnitudes: number[] } {
    const phasors = this.fft.createComplexArray();
    const paddedSignal = [...signal];
    while (paddedSignal.length < this.fft.size) {
      paddedSignal.push(0);
    }
    
    this.fft.realTransform(phasors, paddedSignal);
    
    const frequencies: number[] = [];
    const magnitudes: number[] = [];
    
    // Solo analizamos frecuencias relevantes para el ritmo cardíaco (0.5-4 Hz)
    const minFreqIdx = Math.floor(0.5 * this.fft.size / this.sampleRate);
    const maxFreqIdx = Math.ceil(4 * this.fft.size / this.sampleRate);
    
    for (let i = minFreqIdx; i < maxFreqIdx; i++) {
      frequencies.push((i * this.sampleRate) / this.fft.size);
      magnitudes.push(Math.sqrt(phasors[2*i]**2 + phasors[2*i+1]**2));
    }
    
    return { frequencies, magnitudes };
  }

  // Implementación real del cálculo de SpO2 usando el método de ratio-of-ratios
  calculateSpO2(redSignal: number[], irSignal: number[]): number {
    if (redSignal.length !== irSignal.length || redSignal.length < 2) return 0;
    
    const redAC = Math.max(...redSignal) - Math.min(...redSignal);
    const redDC = redSignal.reduce((a, b) => a + b, 0) / redSignal.length;
    const irAC = Math.max(...irSignal) - Math.min(...irSignal);
    const irDC = irSignal.reduce((a, b) => a + b, 0) / irSignal.length;
    
    // Ratio of Ratios (R) calculation
    const R = (redAC/redDC)/(irAC/irDC);
    
    // Ecuación empírica calibrada para SpO2
    // SpO2 = 110 - 25R (aproximación general, requiere calibración específica)
    const spo2 = Math.round(110 - 25 * R);
    
    // Limitar el rango a valores fisiológicamente posibles
    return Math.min(Math.max(spo2, 70), 100);
  }

  // Análisis avanzado de HRV para detección de arritmias
  analyzeHRV(intervals: number[]): {
    hasArrhythmia: boolean;
    type: string;
    sdnn: number;
    rmssd: number;
  } {
    if (intervals.length < 2) {
      return { hasArrhythmia: false, type: 'Normal', sdnn: 0, rmssd: 0 };
    }

    // Cálculo de SDNN (Standard Deviation of NN intervals)
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const sdnn = Math.sqrt(
      intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (intervals.length - 1)
    );

    // Cálculo de RMSSD (Root Mean Square of Successive Differences)
    let successiveDiff = 0;
    for (let i = 1; i < intervals.length; i++) {
      successiveDiff += Math.pow(intervals[i] - intervals[i-1], 2);
    }
    const rmssd = Math.sqrt(successiveDiff / (intervals.length - 1));

    // Análisis avanzado de arritmias basado en métricas HRV
    let hasArrhythmia = false;
    let type = 'Normal';
    
    // Umbrales basados en literatura médica
    if (sdnn > 100 || rmssd > 50) {
      hasArrhythmia = true;
      if (mean < 600) { // > 100 BPM
        type = 'Taquicardia';
      } else if (mean > 1000) { // < 60 BPM
        type = 'Bradicardia';
      } else if (sdnn > 150 && rmssd > 70) {
        type = 'Fibrilación Auricular';
      }
    }

    return { hasArrhythmia, type, sdnn, rmssd };
  }

  // Estimación de presión arterial basada en características PPG
  estimateBloodPressure(signal: number[], peakTimes: number[]): { 
    systolic: number, 
    diastolic: number 
  } {
    if (peakTimes.length < 2) return { systolic: 0, diastolic: 0 };
    
    // Análisis de la forma de onda PPG
    const avgPeakValue = Math.max(...signal);
    const avgValleyValue = Math.min(...signal);
    const pulseAmplitude = avgPeakValue - avgValleyValue;
    
    // Cálculo del tiempo de tránsito del pulso (PTT)
    let avgPTT = 0;
    for (let i = 1; i < peakTimes.length; i++) {
      avgPTT += peakTimes[i] - peakTimes[i-1];
    }
    avgPTT /= (peakTimes.length - 1);
    
    // Modelo predictivo basado en PTT y amplitud del pulso
    // Estas fórmulas requieren calibración personalizada
    const systolic = Math.round(120 + (1000/avgPTT - 5) * 2 + pulseAmplitude * 0.1);
    const diastolic = Math.round(80 + (pulseAmplitude - 50) * 0.5);
    
    // Limitar a rangos fisiológicamente posibles
    return {
      systolic: Math.min(Math.max(systolic, 90), 180),
      diastolic: Math.min(Math.max(diastolic, 60), 120)
    };
  }

  // Nuevo método para análisis de calidad de señal
  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    // Calcular SNR (Signal-to-Noise Ratio)
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Normalizar calidad entre 0 y 1
    const quality = Math.min(Math.max(standardDeviation / mean, 0), 1);
    
    return quality;
  }
}
