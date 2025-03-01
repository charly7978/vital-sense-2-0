
export class SignalQualityAnalyzer {
  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Calcular la amplitud pico a pico con un umbral mínimo
    const peakToPeak = Math.max(...signal) - Math.min(...signal);
    if (peakToPeak < 20) return 0.1; // Si la amplitud es muy baja, la calidad es mala
    
    // Calcular el ruido de alta frecuencia
    const noiseLevel = this.calculateNoiseLevel(signal);
    
    // Calcular la estabilidad de la línea base
    const baselineStability = this.calculateBaselineStability(signal);
    
    // Evaluar si hay suficiente variación en la señal
    const signalVariation = standardDeviation / mean;
    if (signalVariation < 0.05) return 0.1; // Si hay muy poca variación, la calidad es mala
    
    // Pesos ajustados para cada métrica
    const weights = {
      amplitude: 0.35,
      noise: 0.35,
      baseline: 0.3
    };
    
    // Normalizar y combinar métricas con umbrales más estrictos
    const amplitudeQuality = Math.min(peakToPeak / 150, 1);
    const noiseQuality = 1 - Math.min(noiseLevel * 1.5, 1); // Más sensible al ruido
    const baselineQuality = Math.min(baselineStability, 1);
    
    const quality = 
      amplitudeQuality * weights.amplitude +
      noiseQuality * weights.noise +
      baselineQuality * weights.baseline;
    
    // Ajuste exponencial para hacer el indicador más sensible a calidades bajas
    const adjustedQuality = Math.pow(quality, 1.5);
    
    // Aplicar umbral mínimo más alto
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
    
    // Ajuste para ser más sensible al ruido
    return Math.pow(meanDiff / maxSignal, 0.8);
  }

  private calculateBaselineStability(signal: number[]): number {
    if (signal.length < 10) return 0;
    
    // Ventana más grande para mejor estabilidad
    const windowSize = 8;
    const baseline = [];
    
    for (let i = windowSize; i < signal.length; i++) {
      const windowMean = signal.slice(i - windowSize, i).reduce((a, b) => a + b, 0) / windowSize;
      baseline.push(windowMean);
    }
    
    // Calcular la variación de la línea base
    const baselineVariation = Math.sqrt(
      baseline.reduce((acc, val) => acc + Math.pow(val - baseline[0], 2), 0) / baseline.length
    );
    
    // Normalizar la estabilidad con un factor más estricto
    return Math.exp(-baselineVariation / 8);
  }

  calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    if (redSignal.length < 2 || irSignal.length < 2) return 0;

    const redQuality = this.analyzeSignalQuality(redSignal);
    const irQuality = this.analyzeSignalQuality(irSignal);
    
    // Usar el valor más bajo para ser más conservador
    return Math.min(redQuality, irQuality);
  }
}
