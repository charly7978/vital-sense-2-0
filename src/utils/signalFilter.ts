
export class SignalFilter {
  private readonly sampleRate: number;

  constructor(sampleRate: number = 30) {
    this.sampleRate = sampleRate;
  }

  bandPassFilter(signal: number[], lowCutoff: number, highCutoff: number): number[] {
    const filtered: number[] = [];
    const rc1 = 1.0 / (lowCutoff * 2 * Math.PI);
    const rc2 = 1.0 / (highCutoff * 2 * Math.PI);
    const dt = 1.0 / this.sampleRate;
    const alpha1 = dt / (rc1 + dt);
    const alpha2 = dt / (rc2 + dt);
    
    // Implementar filtro pasa banda basado en Butterworth
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    
    for (let i = 0; i < signal.length; i++) {
      // Pasa altas
      const highPass = alpha1 * (y1 + signal[i] - x1);
      x1 = signal[i];
      y1 = highPass;
      
      // Pasa bajas
      const lowPass = y2 + alpha2 * (highPass - y2);
      y2 = lowPass;
      
      filtered.push(lowPass);
    }
    
    return this.removeDC(filtered);
  }

  private removeDC(signal: number[]): number[] {
    if (signal.length === 0) return signal;
    
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    return signal.map(v => v - mean);
  }
}
