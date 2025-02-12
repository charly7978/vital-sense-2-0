
export class SignalQualityAnalyzer {
  private readonly MIN_RED_INTENSITY = 50;  // Valor mínimo para considerar presencia de dedo
  private readonly MAX_RED_INTENSITY = 255; // Valor máximo posible
  private readonly OPTIMAL_RED_RANGE = { min: 140, max: 240 }; // Ampliado según estudios de PPG
  private readonly MIN_VALID_PIXELS_RATIO = 0.2; // Mínimo ratio de píxeles válidos
  private readonly STABILITY_WINDOW = 10; // Ventana ampliada para mejor análisis
  private readonly VARIANCE_THRESHOLD = 1000; // Umbral de varianza más realista para PPG
  private lastQuality: number = 0;

  analyzeSignalQuality(signal: number[]): number {
    if (!signal || signal.length === 0) return 0;
    
    const redValue = signal[signal.length - 1];

    if (redValue < this.MIN_RED_INTENSITY || redValue > this.MAX_RED_INTENSITY) {
      console.log('Señal fuera de rango:', redValue);
      return 0;
    }

    // Cálculo base de calidad con rango óptimo ajustado
    let quality = 0;
    
    if (redValue >= this.OPTIMAL_RED_RANGE.min && redValue <= this.OPTIMAL_RED_RANGE.max) {
      const rangeMiddle = (this.OPTIMAL_RED_RANGE.max + this.OPTIMAL_RED_RANGE.min) / 2;
      const distanceFromMiddle = Math.abs(redValue - rangeMiddle);
      const maxDistance = (this.OPTIMAL_RED_RANGE.max - this.OPTIMAL_RED_RANGE.min) / 2;
      quality = 1 - (distanceFromMiddle / maxDistance) * 0.5; // Penalización reducida al 50%
    } else {
      const distanceToRange = redValue < this.OPTIMAL_RED_RANGE.min ?
        this.OPTIMAL_RED_RANGE.min - redValue :
        redValue - this.OPTIMAL_RED_RANGE.max;
      
      const maxAllowedDistance = this.OPTIMAL_RED_RANGE.min - this.MIN_RED_INTENSITY;
      quality = Math.max(0.3, 1 - (distanceToRange / maxAllowedDistance) * 0.7); // Mínimo 30% si hay señal
    }

    // Penalizaciones más suaves por valores fuera de rango
    if (redValue < this.OPTIMAL_RED_RANGE.min) {
      quality *= 0.8; // 20% de penalización por señal débil
    } else if (redValue > this.OPTIMAL_RED_RANGE.max) {
      quality *= 0.85; // 15% de penalización por señal muy fuerte
    }

    // Análisis de estabilidad mejorado con ventana más amplia
    if (signal.length >= this.STABILITY_WINDOW) {
      const recentSamples = signal.slice(-this.STABILITY_WINDOW);
      
      // 1. Análisis de varianza con umbrales ajustados
      const recentVariance = this.calculateVariance(recentSamples);
      const varianceQuality = Math.max(0.5, 1 - Math.abs(recentVariance - this.VARIANCE_THRESHOLD) / this.VARIANCE_THRESHOLD);
      
      // 2. Análisis de tendencia con tolerancia aumentada
      const trend = this.calculateTrend(recentSamples);
      const trendQuality = Math.max(0.6, 1 - Math.abs(trend) / 150);
      
      // 3. Análisis de estabilidad local más permisivo
      const stabilityQuality = this.calculateLocalStability(recentSamples);

      // Nueva distribución de pesos basada en importancia real
      const combinedQuality = (
        quality * 0.5 +           // 50% calidad base de la señal
        varianceQuality * 0.2 +   // 20% varianza
        trendQuality * 0.15 +     // 15% tendencia
        stabilityQuality * 0.15   // 15% estabilidad local
      );

      quality = combinedQuality;
    }

    // Suavizado temporal más suave
    quality = this.lastQuality * 0.6 + quality * 0.4;
    this.lastQuality = quality;

    // Log detallado para debugging
    console.log('Análisis de calidad:', {
      redValue,
      quality: quality * 100,
      enRangoOptimo: redValue >= this.OPTIMAL_RED_RANGE.min && redValue <= this.OPTIMAL_RED_RANGE.max,
      estado: this.getQualityStatus(quality)
    });

    return quality;
  }

  private calculateVariance(samples: number[]): number {
    const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
    return samples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / samples.length;
  }

  private calculateTrend(samples: number[]): number {
    if (samples.length < 2) return 0;
    const firstHalf = samples.slice(0, Math.floor(samples.length / 2));
    const secondHalf = samples.slice(Math.floor(samples.length / 2));
    const firstMean = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondMean = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
    return secondMean - firstMean;
  }

  private calculateLocalStability(samples: number[]): number {
    let stabilityScore = 1;
    for (let i = 1; i < samples.length; i++) {
      const change = Math.abs(samples[i] - samples[i-1]);
      if (change > 30) { // Umbral de cambio aumentado
        stabilityScore *= 0.95; // Penalización más suave
      }
    }
    return Math.max(0.7, stabilityScore); // Mínimo 70% de estabilidad si hay señal
  }

  private getQualityStatus(quality: number): string {
    if (quality >= 0.85) return 'ÓPTIMA';
    if (quality >= 0.65) return 'BUENA';
    if (quality >= 0.45) return 'MODERADA';
    if (quality >= 0.25) return 'DÉBIL';
    return 'INSUFICIENTE';
  }
}
