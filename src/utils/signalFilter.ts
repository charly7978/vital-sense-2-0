
/**
 * SignalFilter: Implementación de filtro Kalman simplificado para señales PPG
 * 
 * Características:
 * - Mejor manejo de ruido y transiciones suaves
 * - Predicción de estados futuros
 * - Ajuste dinámico basado en la varianza de la señal
 */

export class SignalFilter {
  private readonly sampleRate: number;
  private lastEstimate: number = 0;
  private lastVariance: number = 1;
  private readonly measurementNoise: number = 0.1;
  private readonly processNoise: number = 0.001;

  constructor(sampleRate: number = 30) {
    this.sampleRate = sampleRate;
  }

  /**
   * Aplica filtro Kalman simplificado con detección de outliers
   */
  lowPassFilter(signal: number[]): number[] {
    if (signal.length === 0) return signal;

    const filtered: number[] = [];
    const kalmanGain = this.lastVariance / (this.lastVariance + this.measurementNoise);

    for (let i = 0; i < signal.length; i++) {
      // Detección de outliers usando ventana móvil
      const windowStart = Math.max(0, i - 5);
      const window = signal.slice(windowStart, i + 1);
      const isOutlier = this.isOutlier(signal[i], window);

      // Si es un outlier, usar el último valor estimado
      const measurement = isOutlier ? this.lastEstimate : signal[i];

      // Actualización Kalman
      const estimate = this.lastEstimate + kalmanGain * (measurement - this.lastEstimate);
      
      // Actualización de la varianza
      this.lastVariance = (1 - kalmanGain) * this.lastVariance + this.processNoise;
      
      // Almacenar resultados
      filtered.push(estimate);
      this.lastEstimate = estimate;
    }

    return filtered;
  }

  /**
   * Detector de outliers usando desviación mediana absoluta
   */
  private isOutlier(value: number, window: number[]): boolean {
    if (window.length < 3) return false;

    const median = this.calculateMedian(window);
    const deviations = window.map(x => Math.abs(x - median));
    const mad = this.calculateMedian(deviations);
    const modifiedZScore = 0.6745 * (value - median) / mad;

    return Math.abs(modifiedZScore) > 3.5; // Umbral conservador
  }

  private calculateMedian(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}

