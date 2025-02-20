
export class SignalFilter {
  private samplingRate: number;

  constructor(samplingRate: number) {
    this.samplingRate = samplingRate;
  }

  lowPassFilter(signal: number[], cutoffFrequency: number): number[] {
    // Implementación simplificada para demo
    return signal.map(x => x * 0.9);
  }
}
