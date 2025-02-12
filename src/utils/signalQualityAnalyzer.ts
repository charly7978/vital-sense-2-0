
export class SignalQualityAnalyzer {
  private readonly MIN_RED_INTENSITY = 50;  // Mínimo valor de rojo aceptable
  private readonly MAX_RED_INTENSITY = 255; // Máximo valor de rojo posible
  private readonly OPTIMAL_RED_RANGE = { min: 150, max: 230 }; // Rango óptimo para PPG

  analyzeSignalQuality(signal: number[]): number {
    // Si no hay señal, retornamos 0
    if (!signal || signal.length === 0) return 0;
    
    // Tomamos el último valor de la señal (el más reciente)
    const redValue = signal[signal.length - 1];

    // Si el valor está por debajo del mínimo, la señal es nula
    if (redValue < this.MIN_RED_INTENSITY) return 0;

    // Si el valor está por encima del máximo, también es mala señal
    if (redValue > this.MAX_RED_INTENSITY) return 0;

    // Calculamos la calidad basada en qué tan cerca está del rango óptimo
    if (redValue >= this.OPTIMAL_RED_RANGE.min && redValue <= this.OPTIMAL_RED_RANGE.max) {
      // Dentro del rango óptimo, calculamos qué tan centrado está
      const rangeMiddle = (this.OPTIMAL_RED_RANGE.max + this.OPTIMAL_RED_RANGE.min) / 2;
      const distanceFromMiddle = Math.abs(redValue - rangeMiddle);
      const maxDistance = (this.OPTIMAL_RED_RANGE.max - this.OPTIMAL_RED_RANGE.min) / 2;
      return 1 - (distanceFromMiddle / maxDistance);
    } else {
      // Fuera del rango óptimo, calidad proporcional a la distancia al rango
      const distanceToRange = redValue < this.OPTIMAL_RED_RANGE.min ?
        this.OPTIMAL_RED_RANGE.min - redValue :
        redValue - this.OPTIMAL_RED_RANGE.max;
      
      const maxDistance = this.OPTIMAL_RED_RANGE.min - this.MIN_RED_INTENSITY;
      return Math.max(0, 1 - (distanceToRange / maxDistance));
    }
  }
}
