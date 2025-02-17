
export class SignalNormalizer {
  private baseline = 0;
  private readonly amplificationFactor = 2.5;
  private readonly smoothingFactor = 0.95;

  normalizeSignal(value: number): number {
    // Actualización de línea base más suave
    this.baseline = this.baseline * this.smoothingFactor + value * (1 - this.smoothingFactor);
    const normalized = value - this.baseline;
    
    // Amplificación mejorada
    const scale = 150;
    const amplified = normalized * scale * this.amplificationFactor;
    
    // Limitar valores extremos
    return Math.max(-100, Math.min(100, amplified)) / Math.max(Math.abs(this.baseline), 0.5);
  }
}
