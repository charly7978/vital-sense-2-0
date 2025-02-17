
export class SignalNormalizer {
  private baseline = 0;
  private readonly amplificationFactor = 3.5; // Aumentado de 2.5 a 3.5
  private readonly smoothingFactor = 0.98; // Aumentado de 0.95 a 0.98 para más suavizado
  private readonly bufferSize = 10;
  private valueBuffer: number[] = [];

  normalizeSignal(value: number): number {
    // Mantener un buffer de valores recientes
    this.valueBuffer.push(value);
    if (this.valueBuffer.length > this.bufferSize) {
      this.valueBuffer.shift();
    }

    // Calcular la media móvil para reducir ruido
    const movingAverage = this.valueBuffer.reduce((a, b) => a + b, 0) / this.valueBuffer.length;
    
    // Actualización de línea base más suave
    this.baseline = this.baseline * this.smoothingFactor + movingAverage * (1 - this.smoothingFactor);
    const normalized = value - this.baseline;
    
    // Amplificación mejorada con factor dinámico
    const scale = 200; // Aumentado de 150 a 200
    const dynamicAmplification = this.amplificationFactor * (1 + Math.abs(normalized) / 100);
    const amplified = normalized * scale * dynamicAmplification;
    
    // Limitar valores extremos con umbral dinámico
    const threshold = 150; // Aumentado de 100 a 150
    return Math.max(-threshold, Math.min(threshold, amplified)) / Math.max(Math.abs(this.baseline), 1.0);
  }
}
