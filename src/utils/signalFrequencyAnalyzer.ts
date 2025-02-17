
import FFT from 'fft.js';

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
    
    // Aplicar ventana Hanning
    for (let i = 0; i < paddedSignal.length; i++) {
      const hann = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (paddedSignal.length - 1)));
      paddedSignal[i] *= hann;
    }
    
    fft.realTransform(phasors, paddedSignal);
    
    const frequencies: number[] = [];
    const magnitudes: number[] = [];
    
    // Analizamos frecuencias relevantes para ritmo cardíaco (0.5-4 Hz = 30-240 BPM)
    const minFreqIdx = Math.floor(0.5 * fft.size / this.sampleRate);
    const maxFreqIdx = Math.ceil(4 * fft.size / this.sampleRate);
    
    for (let i = minFreqIdx; i < maxFreqIdx; i++) {
      const freq = (i * this.sampleRate) / fft.size;
      if (freq >= 0.5 && freq <= 4) { // Solo frecuencias válidas para HR
        frequencies.push(freq);
        // Mejoramos el cálculo de magnitud
        const magnitude = Math.sqrt(phasors[2*i]**2 + phasors[2*i+1]**2);
        magnitudes.push(magnitude);
      }
    }
    
    // Normalizamos magnitudes
    const maxMag = Math.max(...magnitudes);
    if (maxMag > 0) {
      for (let i = 0; i < magnitudes.length; i++) {
        magnitudes[i] = magnitudes[i] / maxMag;
      }
    }
    
    return { frequencies, magnitudes };
  }

  calculateFrequencyDomainMetrics(intervals: number[]): { lf: number; hf: number } {
    if (intervals.length < 2) return { lf: 0, hf: 0 };

    const samplingRate = 4; // Hz para remuestreo
    const interpolatedSignal = this.interpolateRRIntervals(intervals, samplingRate);
    
    const fft = new FFT(Math.pow(2, Math.ceil(Math.log2(interpolatedSignal.length))));
    const signal = fft.createComplexArray();
    fft.realTransform(signal, interpolatedSignal);
    
    let lfPower = 0; // 0.04-0.15 Hz (Baja Frecuencia)
    let hfPower = 0; // 0.15-0.4 Hz (Alta Frecuencia)
    
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
    if (intervals.length === 0) return [];

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
      
      interpolated[i] = intervals[intervalIndex];
    }
    
    return interpolated;
  }
}
