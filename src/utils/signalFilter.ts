
export class SignalFilter {
  private readonly sampleRate: number;
  private readonly alpha: number;
  private lastFiltered: number = 0;

  constructor(sampleRate: number = 30) {
    this.sampleRate = sampleRate;
    this.alpha = 1 / (1 + 2 * Math.PI * (5 / sampleRate)); // Filtro paso bajo a 5Hz
  }

  lowPassFilter(signal: number[], cutoffFreq: number): number[] {
    const filtered: number[] = [];
    const dt = 1.0 / this.sampleRate;
    const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
    const alpha = dt / (rc + dt);
    
    // Aplicar filtro paso bajo
    for (let i = 0; i < signal.length; i++) {
      if (i === 0) {
        filtered[i] = signal[i];
      } else {
        filtered[i] = filtered[i-1] + alpha * (signal[i] - filtered[i-1]);
      }
    }
    
    // Aplicar suavizado adicional
    const smoothed = this.smoothSignal(filtered);
    
    return smoothed;
  }

  private smoothSignal(signal: number[]): number[] {
    const windowSize = 5;
    const smoothed: number[] = [];
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - windowSize + 1); j <= Math.min(i + windowSize - 1, signal.length - 1); j++) {
        sum += signal[j];
        count++;
      }
      
      smoothed[i] = sum / count;
    }
    
    return smoothed;
  }

  reset() {
    this.lastFiltered = 0;
  }
}
