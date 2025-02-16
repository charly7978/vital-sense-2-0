
export class SignalQualityAnalyzer {
  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const standardDeviation = Math.sqrt(variance);
    
    const noiseLevel = this.calculateNoiseLevel(signal);
    const snrQuality = Math.min(standardDeviation / mean, 1);
    const noiseQuality = Math.max(1 - noiseLevel, 0);
    
    const quality = (snrQuality + noiseQuality) / 2;
    return Math.min(Math.max(quality, 0), 1);
  }

  calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    const redVariance = this.calculateVariance(redSignal);
    const irVariance = this.calculateVariance(irSignal);
    
    const maxVariance = Math.max(redVariance, irVariance);
    if (maxVariance === 0) return 1.0;
    
    const stabilityScore = 1.0 - (Math.min(maxVariance, 1000) / 1000);
    return Math.max(stabilityScore, 0.1);
  }

  private calculateNoiseLevel(signal: number[]): number {
    const differences = [];
    for (let i = 1; i < signal.length; i++) {
      differences.push(Math.abs(signal[i] - signal[i-1]));
    }
    
    const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const maxSignal = Math.max(...signal) - Math.min(...signal);
    
    return meanDiff / maxSignal;
  }

  private calculateVariance(signal: number[]): number {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    return signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
  }
}

