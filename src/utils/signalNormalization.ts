
export class SignalNormalizer {
  private baseline = 0;
  private readonly amplificationFactor = 1.8; // Aumentado para mejor visualización

  normalizeSignal(value: number): number {
    // Actualización de línea base más sensible
    this.baseline = this.baseline * 0.92 + value * 0.08;
    const normalized = value - this.baseline;
    
    // Amplificación aumentada
    const scale = 150; // Aumentado para mejor visualización
    return normalized * scale * this.amplificationFactor / Math.max(Math.abs(this.baseline), 1);
  }
}
