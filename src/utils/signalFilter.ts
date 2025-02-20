
export class SignalFilter {
  private readonly sampleRate: number;
  private readonly bufferSize = 64;
  private readonly alpha = 0.95; // Coeficiente para filtro paso bajo
  private readonly beta = 0.85;  // Coeficiente para filtro de mediana móvil
  private readonly gamma = 0.75; // Coeficiente para eliminación de tendencia
  private lastFiltered = 0;
  private medianBuffer: number[] = [];
  private readonly baselineWindow = 25;
  private baseline = 0;

  constructor(sampleRate: number = 30) {
    this.sampleRate = sampleRate;
  }

  public lowPassFilter(signal: number[], cutoffFreq: number): number[] {
    const filtered: number[] = [];
    const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
    const dt = 1.0 / this.sampleRate;
    const alpha = dt / (rc + dt);

    // Aplicar filtro paso bajo con ventana deslizante
    for (let i = 0; i < signal.length; i++) {
      if (i === 0) {
        filtered[i] = signal[i];
        continue;
      }

      // Aplicar filtro exponencial
      filtered[i] = alpha * signal[i] + (1 - alpha) * filtered[i - 1];
      
      // Aplicar filtro de mediana móvil
      const windowStart = Math.max(0, i - this.bufferSize);
      const window = signal.slice(windowStart, i + 1);
      const median = this.calculateMedian(window);
      
      // Combinar filtros con pesos
      filtered[i] = this.alpha * filtered[i] + 
                   (1 - this.alpha) * (this.beta * median + (1 - this.beta) * signal[i]);
    }

    // Eliminar tendencia de la señal
    return this.removeTrend(filtered);
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[middle - 1] + sorted[middle]) / 2;
    }
    return sorted[middle];
  }

  private removeTrend(signal: number[]): number[] {
    const detrended: number[] = [];
    let baseline = signal[0];

    for (let i = 0; i < signal.length; i++) {
      // Actualizar línea base con ventana móvil
      const windowStart = Math.max(0, i - this.baselineWindow);
      const windowEnd = Math.min(signal.length, i + this.baselineWindow + 1);
      const window = signal.slice(windowStart, windowEnd);
      const localBaseline = this.calculateMedian(window);

      // Actualizar línea base con suavizado exponencial
      baseline = this.gamma * baseline + (1 - this.gamma) * localBaseline;

      // Eliminar tendencia
      detrended[i] = signal[i] - baseline;
    }

    return this.normalizeSignal(detrended);
  }

  private normalizeSignal(signal: number[]): number[] {
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const range = max - min;

    if (range === 0) return signal;

    return signal.map(value => (value - min) / range * 2 - 1);
  }
}

