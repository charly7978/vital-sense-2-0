
export class SignalQualityAnalyzer {
  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const standardDeviation = Math.sqrt(variance);
    
    const noiseLevel = this.calculateNoiseLevel(signal);
    const signalStrength = Math.max(...signal) - Math.min(...signal);
    const snrQuality = Math.min(standardDeviation / (mean + 0.0001), 1);
    const noiseQuality = Math.max(1 - noiseLevel, 0);
    const strengthQuality = Math.min(signalStrength / 100, 1);
    
    // Dar más peso a la calidad de la señal y menos al ruido
    const quality = (snrQuality * 0.4 + noiseQuality * 0.3 + strengthQuality * 0.3);
    
    // Aplicar una función exponencial para hacer el indicador más sensible
    const sensitiveFactor = Math.pow(quality, 1.5);
    
    return Math.min(Math.max(sensitiveFactor, 0), 1);
  }

  calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    if (redSignal.length < 2 || irSignal.length < 2) return 0;

    const redVariance = this.calculateVariance(redSignal);
    const irVariance = this.calculateVariance(irSignal);
    
    const maxVariance = Math.max(redVariance, irVariance);
    if (maxVariance === 0) return 0.1;
    
    const stabilityScore = 1.0 - (Math.min(maxVariance, 1000) / 1000);
    return Math.max(stabilityScore, 0.1);
  }

  private calculateNoiseLevel(signal: number[]): number {
    if (signal.length < 2) return 1;

    const differences = [];
    for (let i = 1; i < signal.length; i++) {
      differences.push(Math.abs(signal[i] - signal[i-1]));
    }
    
    const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const maxSignal = Math.max(...signal) - Math.min(...signal);
    
    if (maxSignal === 0) return 1;
    
    // Normalizar el nivel de ruido
    return Math.min(meanDiff / maxSignal, 1);
  }

  private calculateVariance(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    return signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
  }
}
