
/**
 * SignalNormalizer: Normalización adaptativa con memoria exponencial
 * 
 * Características:
 * - Normalización adaptativa con memoria de corto y largo plazo
 * - Detección de cambios abruptos
 * - Estabilización de señal mediante suavizado exponencial
 */

export class SignalNormalizer {
  private shortTermBaseline: number = 0;
  private longTermBaseline: number = 0;
  private readonly alpha: number = 0.1;  // Factor de aprendizaje corto plazo
  private readonly beta: number = 0.01;  // Factor de aprendizaje largo plazo
  private readonly threshold: number = 50; // Umbral para cambios abruptos
  private lastValue: number = 0;
  private stabilityCount: number = 0;

  normalizeSignal(value: number): number {
    // Detección de cambios abruptos
    const delta = Math.abs(value - this.lastValue);
    
    if (delta > this.threshold) {
      this.stabilityCount = 0;
    } else {
      this.stabilityCount = Math.min(this.stabilityCount + 1, 10);
    }

    // Actualización de líneas base con diferentes velocidades
    if (this.stabilityCount > 5) {
      this.shortTermBaseline = this.shortTermBaseline * (1 - this.alpha) + value * this.alpha;
      this.longTermBaseline = this.longTermBaseline * (1 - this.beta) + value * this.beta;
    }

    // Normalización usando ambas líneas base
    const shortTermDiff = value - this.shortTermBaseline;
    const longTermDiff = value - this.longTermBaseline;
    
    // Ponderación adaptativa basada en estabilidad
    const stabilityWeight = Math.min(this.stabilityCount / 10, 1);
    const normalizedValue = (shortTermDiff * (1 - stabilityWeight) + longTermDiff * stabilityWeight);

    // Escalado adaptativo
    const scale = 100 / Math.max(Math.abs(this.longTermBaseline), 1);
    this.lastValue = value;

    return normalizedValue * scale;
  }
}

