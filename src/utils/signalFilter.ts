
/**
 * SignalFilter: Filtrado de señal PPG en tiempo real
 * 
 * IMPORTANTE: Este filtro procesa ÚNICAMENTE datos reales de la cámara.
 * No genera datos sintéticos ni simula señales. Cada valor filtrado
 * corresponde a una medición real procesada para reducir el ruido
 * mientras preserva las características genuinas de la onda de pulso.
 */

export class SignalFilter {
  private readonly sampleRate: number;
  private readonly filterWindow = 5; // Ventana pequeña para respuesta rápida

  constructor(sampleRate: number = 30) { // 30 fps es típico en cámaras web
    this.sampleRate = sampleRate;
  }

  /**
   * Aplica un filtro de media móvil simple pero efectivo
   * Preserva la forma real de la onda PPG mientras reduce ruido de alta frecuencia
   */
  lowPassFilter(signal: number[]): number[] {
    if (signal.length < this.filterWindow) return signal;

    const filtered: number[] = [];
    
    // Media móvil con pesos
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let weightSum = 0;
      
      for (let j = Math.max(0, i - this.filterWindow + 1); j <= i; j++) {
        // Los valores más recientes tienen más peso
        const weight = (j - (i - this.filterWindow)) / this.filterWindow;
        sum += signal[j] * weight;
        weightSum += weight;
      }
      
      filtered[i] = sum / weightSum;
    }
    
    return filtered;
  }
}
