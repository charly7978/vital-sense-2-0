
export class SignalNormalizer {
  private baseline = 0;
  private readonly alpha = 0.05; // Factor de suavizado
  private maxValue = 1;
  private minValue = -1;

  normalizeSignal(value: number): number {
    // Actualización de la línea base con suavizado exponencial
    this.baseline = this.baseline * (1 - this.alpha) + value * this.alpha;
    
    // Normalización con respecto a la línea base
    const normalized = value - this.baseline;
    
    // Actualización dinámica del rango
    this.maxValue = Math.max(this.maxValue * 0.99, Math.abs(normalized));
    this.minValue = Math.min(this.minValue * 0.99, -Math.abs(normalized));
    
    // Escalado adaptativo
    const scale = 100 / (this.maxValue - this.minValue);
    return normalized * scale;
  }

  reset() {
    this.baseline = 0;
    this.maxValue = 1;
    this.minValue = -1;
  }
}
