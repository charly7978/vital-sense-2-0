
export class SignalFilter {
  private readonly MA_WINDOW_SIZE = 5;
  private readonly EXP_ALPHA = 0.3;
  private readonly DERIVATE_THRESHOLD = 0.05;
  private lastFilteredValue = 0;

  filterSignal(signal: number[]): number[] {
    if (signal.length === 0) return [];

    // Paso 1: Media móvil
    const maFiltered = this.movingAverage(signal);
    
    // Paso 2: Filtro exponencial
    const expFiltered = this.exponentialFilter(maFiltered);
    
    // Paso 3: Eliminación de tendencia
    const detrended = this.detrendSignal(expFiltered);

    console.log('🔧 Filtrado:', {
      original: signal,
      mediaMovil: maFiltered,
      exponencial: expFiltered,
      sinTendencia: detrended
    });

    return detrended;
  }

  private movingAverage(signal: number[]): number[] {
    const result: number[] = [];
    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - this.MA_WINDOW_SIZE + 1);
      const window = signal.slice(start, i + 1);
      result.push(window.reduce((a, b) => a + b, 0) / window.length);
    }
    return result;
  }

  private exponentialFilter(signal: number[]): number[] {
    return signal.map(value => {
      this.lastFilteredValue = this.EXP_ALPHA * value + 
                              (1 - this.EXP_ALPHA) * this.lastFilteredValue;
      return this.lastFilteredValue;
    });
  }

  private detrendSignal(signal: number[]): number[] {
    if (signal.length < 2) return signal;
    
    const result: number[] = [signal[0]];
    for (let i = 1; i < signal.length; i++) {
      const diff = signal[i] - signal[i-1];
      if (Math.abs(diff) < this.DERIVATE_THRESHOLD) {
        result.push(result[i-1]);
      } else {
        result.push(signal[i]);
      }
    }
    return result;
  }

  reset(): void {
    this.lastFilteredValue = 0;
  }
}
