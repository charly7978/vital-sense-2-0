
export class SignalNormalizer {
  private baseline = 0;
  private readonly amplificationFactor = 2.5; // Aumentado significativamente

  normalizeSignal(value: number): number {
    // Actualización de línea base más sensible
    this.baseline = this.baseline * 0.85 + value * 0.15; // Más peso a nuevos valores
    const normalized = value - this.baseline;
    
    // Amplificación aumentada significativamente
    const scale = 200; // Aumentado para mejor visualización
    return normalized * scale * this.amplificationFactor / Math.max(Math.abs(this.baseline), 0.5);
  }
}
