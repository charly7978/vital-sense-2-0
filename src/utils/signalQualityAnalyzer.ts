
export class SignalQualityAnalyzer {
  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Calcular la amplitud pico a pico con un umbral mínimo más bajo
    const peakToPeak = Math.max(...signal) - Math.min(...signal);
    if (peakToPeak < 10) return 0.1; // Umbral más bajo para la amplitud mínima
    
    // Calcular el ruido de alta frecuencia
    const noiseLevel = this.calculateNoiseLevel(signal);
    
    // Calcular la estabilidad de la línea base
    const baselineStability = this.calculateBaselineStability(signal);
    
    // Evaluar si hay suficiente variación en la señal (umbral más bajo)
    const signalVariation = standardDeviation / mean;
    if (signalVariation < 0.02) return 0.1; // Umbral más bajo para la variación mínima
    
    // Pesos ajustados para cada métrica
    const weights = {
      amplitude: 0.4,
      noise: 0.3,
      baseline: 0.3
    };
    
    // Normalizar y combinar métricas con umbrales más bajos
    const amplitudeQuality = Math.min(peakToPeak / 100, 1); // Umbral más bajo para amplitud
    const noiseQuality = 1 - Math.min(noiseLevel * 1.2, 1);
    const baselineQuality = Math.min(baselineStability, 1);
    
    const quality = 
      amplitudeQuality * weights.amplitude +
      noiseQuality * weights.noise +
      baselineQuality * weights.baseline;
    
    // Ajuste menos agresivo para hacer el indicador más sensible
    const adjustedQuality = Math.pow(quality, 1.2);
    
    return Math.min(Math.max(adjustedQuality, 0), 1);
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
    
    // Ajuste menos sensible al ruido
    return Math.pow(meanDiff / maxSignal, 0.5);
  }

  private calculateBaselineStability(signal: number[]): number {
    if (signal.length < 10) return 0;
    
    const windowSize = 8;
    const baseline = [];
    
    for (let i = windowSize; i < signal.length; i++) {
      const windowMean = signal.slice(i - windowSize, i).reduce((a, b) => a + b, 0) / windowSize;
      baseline.push(windowMean);
    }
    
    const baselineVariation = Math.sqrt(
      baseline.reduce((acc, val) => acc + Math.pow(val - baseline[0], 2), 0) / baseline.length
    );
    
    // Normalizar la estabilidad con un factor menos estricto
    return Math.exp(-baselineVariation / 12);
  }

  calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    if (redSignal.length < 2 || irSignal.length < 2) return 0;

    const redQuality = this.analyzeSignalQuality(redSignal);
    const irQuality = this.analyzeSignalQuality(irSignal);
    
    // Usar un promedio ponderado en lugar del mínimo
    return (redQuality * 0.7 + irQuality * 0.3);
  }
}
