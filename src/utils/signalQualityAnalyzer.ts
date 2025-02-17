
export class SignalQualityAnalyzer {
  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Análisis de amplitud
    const peakToPeak = Math.max(...signal) - Math.min(...signal);
    if (peakToPeak < 5) return 0.2; // Reducido el umbral mínimo
    
    // Análisis de ruido
    const noiseLevel = this.calculateNoiseLevel(signal);
    
    // Análisis de estabilidad
    const baselineStability = this.calculateBaselineStability(signal);
    
    // Análisis de variación
    const signalVariation = standardDeviation / mean;
    if (signalVariation < 0.01) return 0.2; // Reducido el umbral mínimo
    
    // Pesos reajustados para ser menos estrictos
    const weights = {
      amplitude: 0.35,
      noise: 0.3,
      baseline: 0.35
    };
    
    // Normalización más generosa
    const amplitudeQuality = Math.min((peakToPeak / 50), 1); // Reducido el denominador
    const noiseQuality = 1 - Math.min(noiseLevel, 0.8); // Más tolerante al ruido
    const baselineQuality = Math.min(baselineStability * 1.5, 1); // Amplificado
    
    // Cálculo de calidad final
    const rawQuality = 
      amplitudeQuality * weights.amplitude +
      noiseQuality * weights.noise +
      baselineQuality * weights.baseline;
    
    // Ajuste más generoso de la calidad final
    const adjustedQuality = Math.pow(rawQuality, 0.8); // Exponente reducido para aumentar valores
    
    const finalQuality = Math.min(Math.max(adjustedQuality, 0), 1);
    
    // Logging detallado de las métricas
    console.log('Métricas de calidad:', {
      pixel: noiseQuality,
      stability: baselineQuality,
      red: amplitudeQuality,
      perfusion: finalQuality,
      finalQuality: finalQuality,
      perfusionIndex: (peakToPeak / mean) * 100
    });
    
    return finalQuality;
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
    
    // Menos sensible al ruido
    return Math.pow(meanDiff / maxSignal, 0.7); // Exponente aumentado para reducir penalización
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
    
    // Más tolerante a variaciones en la línea base
    return Math.exp(-baselineVariation / 20); // Aumentado denominador para ser menos estricto
  }

  calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    if (redSignal.length < 2 || irSignal.length < 2) return 0;

    const redQuality = this.analyzeSignalQuality(redSignal);
    const irQuality = this.analyzeSignalQuality(irSignal);
    
    // Promedio ponderado ajustado
    return Math.pow((redQuality * 0.6 + irQuality * 0.4), 0.8);
  }
}
