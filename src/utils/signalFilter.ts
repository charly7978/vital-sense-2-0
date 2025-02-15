
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
  private readonly sgWindow = 7; // Ventana de Savitzky-Golay
  private readonly sgDegree = 2; // Grado del polinomio
  private readonly sgCoeffs: number[]; // Coeficientes precalculados

  constructor(sampleRate: number = 30) {
    this.sampleRate = sampleRate;
    // Coeficientes precalculados para Savitzky-Golay de orden 2, ventana 7
    this.sgCoeffs = [-0.095238, 0.142857, 0.285714, 0.333333, 0.285714, 0.142857, -0.095238];
  }

  /**
   * Aplica el filtro Savitzky-Golay para suavizar la señal
   * mientras preserva las características de los picos
   */
  lowPassFilter(signal: number[]): number[] {
    if (signal.length < this.sgWindow) return signal;

    const filtered: number[] = [];
    const halfWindow = Math.floor(this.sgWindow / 2);
    
    // Aplicar filtro Savitzky-Golay
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      
      for (let j = 0; j < this.sgWindow; j++) {
        const idx = i - halfWindow + j;
        // Manejo de bordes usando reflexión
        const value = idx < 0 ? signal[0] :
                     idx >= signal.length ? signal[signal.length - 1] :
                     signal[idx];
        sum += value * this.sgCoeffs[j];
      }
      
      filtered.push(sum);
    }

    // Normalización adicional usando ventana móvil
    const normalizedSignal = this.normalizeSignal(filtered);
    
    return normalizedSignal;
  }

  /**
   * Normaliza la señal usando una ventana móvil para adaptarse
   * a cambios en la amplitud de la señal
   */
  private normalizeSignal(signal: number[]): number[] {
    const windowSize = 30; // 1 segundo a 30fps
    const normalized: number[] = [];
    
    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - windowSize);
      const window = signal.slice(start, i + 1);
      const min = Math.min(...window);
      const max = Math.max(...window);
      const range = max - min;
      
      if (range === 0) {
        normalized.push(0);
      } else {
        normalized.push((signal[i] - min) / range);
      }
    }
    
    return normalized;
  }
}

