
export class SignalQualityAnalyzer {
  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const standardDeviation = Math.sqrt(variance);
    
    // Análisis de amplitud con umbrales más permisivos
    const peakToPeak = Math.max(...signal) - Math.min(...signal);
    const amplitudeScore = this.calculateAmplitudeScore(peakToPeak);
    
    // Análisis de ruido mejorado
    const noiseScore = this.calculateNoiseScore(signal);
    
    // Análisis de estabilidad con ventana adaptativa
    const stabilityScore = this.calculateStabilityScore(signal);
    
    // Ponderación dinámica basada en las características de la señal
    const weights = this.calculateDynamicWeights(amplitudeScore, noiseScore, stabilityScore);
    
    // Cálculo de calidad final con normalización adaptativa
    const qualityScore = (
      amplitudeScore * weights.amplitude +
      noiseScore * weights.noise +
      stabilityScore * weights.stability
    );
    
    // Aplicar curva de respuesta suave para valores bajos
    const finalQuality = this.smoothQualityResponse(qualityScore);
    
    // Logging detallado para diagnóstico
    console.log('📊 Análisis de calidad:', {
      amplitud: {
        picoPico: peakToPeak.toFixed(2),
        score: amplitudeScore.toFixed(3)
      },
      ruido: {
        score: noiseScore.toFixed(3)
      },
      estabilidad: {
        score: stabilityScore.toFixed(3)
      },
      pesos: weights,
      calidadFinal: finalQuality.toFixed(3)
    });
    
    return finalQuality;
  }

  private calculateAmplitudeScore(peakToPeak: number): number {
    // Curva de respuesta suave para amplitud
    const minAmplitude = 3;
    const optimalAmplitude = 30;
    if (peakToPeak < minAmplitude) return 0.3;
    return Math.min(1, Math.pow(peakToPeak / optimalAmplitude, 0.5));
  }

  private calculateNoiseScore(signal: number[]): number {
    if (signal.length < 2) return 0;

    const differences = [];
    for (let i = 1; i < signal.length; i++) {
      differences.push(Math.abs(signal[i] - signal[i-1]));
    }
    
    const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const maxDiff = Math.max(...differences);
    
    // Normalización adaptativa del ruido
    const noiseRatio = meanDiff / maxDiff;
    return 1 - Math.min(noiseRatio * 2, 0.7); // Más tolerante al ruido
  }

  private calculateStabilityScore(signal: number[]): number {
    if (signal.length < 8) return 0;
    
    const windowSize = Math.min(8, Math.floor(signal.length / 2));
    const windows = [];
    
    for (let i = windowSize; i < signal.length; i++) {
      const window = signal.slice(i - windowSize, i);
      const windowMean = window.reduce((a, b) => a + b, 0) / windowSize;
      windows.push(windowMean);
    }
    
    const meanStability = windows.reduce((a, b) => a + b, 0) / windows.length;
    const stabilityVariation = Math.sqrt(
      windows.reduce((acc, val) => acc + Math.pow(val - meanStability, 2), 0) / windows.length
    );
    
    // Función de estabilidad más tolerante
    return Math.exp(-stabilityVariation / 25);
  }

  private calculateDynamicWeights(amplitude: number, noise: number, stability: number): {
    amplitude: number;
    noise: number;
    stability: number;
  } {
    // Ajustar pesos según la calidad relativa de cada métrica
    const total = amplitude + noise + stability;
    const baseWeight = 1 / 3;
    
    return {
      amplitude: 0.4 + (amplitude / total) * 0.2,
      noise: 0.3 + (noise / total) * 0.2,
      stability: 0.3 + (stability / total) * 0.2
    };
  }

  private smoothQualityResponse(quality: number): number {
    // Función de suavizado para mejorar la respuesta en valores bajos
    const smoothedQuality = Math.pow(quality, 0.7);
    return Math.min(Math.max(smoothedQuality, 0), 1);
  }

  calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    if (redSignal.length < 2 || irSignal.length < 2) return 0;

    const redQuality = this.analyzeSignalQuality(redSignal);
    const irQuality = this.analyzeSignalQuality(irSignal);
    
    // Promedio ponderado con más peso en la señal roja
    const weightedQuality = redQuality * 0.7 + irQuality * 0.3;
    return Math.pow(weightedQuality, 0.8); // Suavizado final
  }
}
