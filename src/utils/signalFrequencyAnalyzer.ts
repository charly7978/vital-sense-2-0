
import FFT from 'fft.js';

/**
 * SignalFrequencyAnalyzer: Análisis de frecuencia en tiempo real de la señal PPG
 * 
 * IMPORTANTE: Este analizador procesa ÚNICAMENTE señales reales capturadas.
 * Los espectros de frecuencia y potencia corresponden a las variaciones
 * reales del flujo sanguíneo detectadas por la cámara.
 */
export class SignalFrequencyAnalyzer {
  private readonly sampleRate: number;

  constructor(sampleRate: number = 30) {
    this.sampleRate = sampleRate;
  }

  performFFT(signal: number[]): { frequencies: number[], magnitudes: number[] } {
    const fft = new FFT(Math.pow(2, Math.ceil(Math.log2(Math.max(signal.length, 2)))));
    const phasors = fft.createComplexArray();
    const paddedSignal = [...signal];
    
    // Zero padding
    while (paddedSignal.length < fft.size) {
      paddedSignal.push(0);
    }
    
    // Apply Hanning window to reduce spectral leakage
    for (let i = 0; i < paddedSignal.length; i++) {
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (paddedSignal.length - 1)));
      paddedSignal[i] *= hann;
    }
    
    fft.realTransform(phasors, paddedSignal);
    
    const frequencies: number[] = [];
    const magnitudes: number[] = [];
    
    // Analyze frequencies relevant for heart rate (0.5-4 Hz)
    const minFreqIdx = Math.floor(0.5 * fft.size / this.sampleRate);
    const maxFreqIdx = Math.ceil(4 * fft.size / this.sampleRate);
    
    for (let i = minFreqIdx; i < maxFreqIdx; i++) {
      frequencies.push((i * this.sampleRate) / fft.size);
      magnitudes.push(2 * Math.sqrt(phasors[2*i]**2 + phasors[2*i+1]**2) / fft.size);
    }
    
    return { frequencies, magnitudes };
  }
}
