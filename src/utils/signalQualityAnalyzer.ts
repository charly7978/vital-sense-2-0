
export class SignalQualityAnalyzer {
  private readonly MIN_RED_INTENSITY = 50;  // Valor mínimo para considerar presencia de dedo
  private readonly MAX_RED_INTENSITY = 255; // Valor máximo posible
  private readonly OPTIMAL_RED_RANGE = { min: 150, max: 230 }; // Rango óptimo para PPG
  private readonly MIN_VALID_PIXELS_RATIO = 0.2; // Mínimo ratio de píxeles válidos
  private readonly MIN_SIGNAL_AMPLITUDE = 10; // Mínima amplitud de señal aceptable
  private readonly MAX_CONSECUTIVE_SIMILAR = 3; // Máximo número de valores similares consecutivos

  analyzeSignalQuality(signal: number[]): number {
    // Si no hay señal, retornamos 0
    if (!signal || signal.length === 0) return 0;
    
    // Tomamos el último valor de la señal (el más reciente)
    const redValue = signal[signal.length - 1];

    // Validaciones estrictas para presencia de dedo
    if (redValue < this.MIN_RED_INTENSITY || redValue > this.MAX_RED_INTENSITY) {
      console.log('Señal fuera de rango:', redValue);
      return 0;
    }

    // Análisis de estabilidad en las últimas muestras
    if (signal.length >= 5) {
      const recentSamples = signal.slice(-5);
      
      // Verificar varianza
      const variance = this.calculateVariance(recentSamples);
      const maxVariance = 1000;
      if (variance > maxVariance) {
        console.log('Señal muy inestable:', variance);
        return 0;
      }

      // Verificar amplitud mínima de la señal
      const amplitude = Math.max(...recentSamples) - Math.min(...recentSamples);
      if (amplitude < this.MIN_SIGNAL_AMPLITUDE) {
        console.log('Amplitud insuficiente:', amplitude);
        return 0;
      }

      // Verificar si hay demasiados valores similares consecutivos (señal plana)
      let similarCount = 1;
      for (let i = 1; i < recentSamples.length; i++) {
        if (Math.abs(recentSamples[i] - recentSamples[i-1]) < 2) {
          similarCount++;
          if (similarCount > this.MAX_CONSECUTIVE_SIMILAR) {
            console.log('Señal demasiado plana');
            return 0;
          }
        } else {
          similarCount = 1;
        }
      }
    }

    // Calculamos la calidad basada en qué tan cerca está del rango óptimo
    let quality = 0;
    
    if (redValue >= this.OPTIMAL_RED_RANGE.min && redValue <= this.OPTIMAL_RED_RANGE.max) {
      // Dentro del rango óptimo
      const rangeMiddle = (this.OPTIMAL_RED_RANGE.max + this.OPTIMAL_RED_RANGE.min) / 2;
      const distanceFromMiddle = Math.abs(redValue - rangeMiddle);
      const maxDistance = (this.OPTIMAL_RED_RANGE.max - this.OPTIMAL_RED_RANGE.min) / 2;
      quality = 1 - (distanceFromMiddle / maxDistance);
    } else {
      // Fuera del rango óptimo
      const distanceToRange = redValue < this.OPTIMAL_RED_RANGE.min ?
        this.OPTIMAL_RED_RANGE.min - redValue :
        redValue - this.OPTIMAL_RED_RANGE.max;
      
      const maxAllowedDistance = this.OPTIMAL_RED_RANGE.min - this.MIN_RED_INTENSITY;
      quality = Math.max(0, 1 - (distanceToRange / maxAllowedDistance));
    }

    // Penalización por valor fuera de rango óptimo
    if (redValue < this.OPTIMAL_RED_RANGE.min) {
      quality *= 0.5; // 50% de penalización por señal débil
    } else if (redValue > this.OPTIMAL_RED_RANGE.max) {
      quality *= 0.7; // 30% de penalización por señal muy fuerte
    }

    // Si hay suficientes muestras, aplicar penalización por variabilidad
    if (signal.length >= 5) {
      const recentVariance = this.calculateVariance(signal.slice(-5));
      const optimalVariance = 500; // Valor de varianza considerado óptimo
      const varianceQuality = Math.max(0, 1 - Math.abs(recentVariance - optimalVariance) / optimalVariance);
      quality *= (0.7 + 0.3 * varianceQuality); // La varianza afecta hasta un 30% de la calidad
    }

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

  private getQualityStatus(quality: number): string {
    if (quality >= 0.9) return 'ÓPTIMA';
    if (quality >= 0.7) return 'BUENA';
    if (quality >= 0.5) return 'MODERADA';
    if (quality >= 0.2) return 'DÉBIL';
    return 'INSUFICIENTE';
  }
}
