import FFT from 'fft.js';

export class SignalProcessor {
  private fft: any;
  private readonly sampleRate = 30; // 30 fps
  
  constructor(size: number) {
    // Ensure size is a power of 2 by finding the next power of 2
    const fftSize = Math.pow(2, Math.ceil(Math.log2(Math.max(size, 2))));
    this.fft = new FFT(fftSize);
  }

  // Filtro de paso bajo
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

  // Análisis de FFT
  performFFT(signal: number[]): { frequencies: number[], magnitudes: number[] } {
    const phasors = this.fft.createComplexArray();
    this.fft.realTransform(phasors, signal);
    
    const frequencies: number[] = [];
    const magnitudes: number[] = [];
    
    for (let i = 0; i < phasors.length / 2; i++) {
      frequencies.push((i * this.sampleRate) / phasors.length);
      magnitudes.push(Math.sqrt(phasors[2*i]**2 + phasors[2*i+1]**2));
    }
    
    return { frequencies, magnitudes };
  }

  // Cálculo de SpO2 usando ratio de ratios
  calculateSpO2(redSignal: number[], irSignal: number[]): number {
    if (redSignal.length !== irSignal.length) return 0;
    
    const redAC = Math.max(...redSignal) - Math.min(...redSignal);
    const redDC = redSignal.reduce((a, b) => a + b, 0) / redSignal.length;
    const irAC = Math.max(...irSignal) - Math.min(...irSignal);
    const irDC = irSignal.reduce((a, b) => a + b, 0) / irSignal.length;
    
    const R = (redAC/redDC)/(irAC/irDC);
    // Ecuación empírica de calibración SpO2
    return Math.round(110 - 25 * R);
  }

  // Análisis de HRV para detección de arritmias
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

    // Detección de arritmias basada en umbrales de HRV
    const hasArrhythmia = sdnn > 100 || rmssd > 50;
    let type = 'Normal';
    
    if (hasArrhythmia) {
      if (mean < 600) { // > 100 BPM
        type = 'Taquicardia';
      } else if (mean > 1000) { // < 60 BPM
        type = 'Bradicardia';
      } else if (sdnn > 150) {
        type = 'Fibrilación Auricular';
      }
    }

    return { hasArrhythmia, type, sdnn, rmssd };
  }

  // Estimación de presión arterial basada en características PPG
  estimateBloodPressure(signal: number[], peakTimes: number[]): { systolic: number, diastolic: number } {
    if (peakTimes.length < 2) return { systolic: 0, diastolic: 0 };
    
    // Análisis de la forma de onda PPG
    const avgPeakValue = Math.max(...signal);
    const avgValleyValue = Math.min(...signal);
    const pulseAmplitude = avgPeakValue - avgValleyValue;
    
    // Tiempo de tránsito del pulso (PTT) promedio
    let avgPTT = 0;
    for (let i = 1; i < peakTimes.length; i++) {
      avgPTT += peakTimes[i] - peakTimes[i-1];
    }
    avgPTT /= (peakTimes.length - 1);
    
    // Estimación basada en características de la señal
    // Estas fórmulas son aproximadas y requieren calibración
    const systolic = Math.round(120 + (1000/avgPTT - 5) * 2);
    const diastolic = Math.round(80 + (pulseAmplitude - 50) * 0.5);
    
    return {
      systolic: Math.min(Math.max(systolic, 90), 180),
      diastolic: Math.min(Math.max(diastolic, 60), 120)
    };
  }
}
