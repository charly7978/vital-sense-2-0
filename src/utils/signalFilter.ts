
export class SignalFilter {
  private readonly windowSize = 5;
  private readonly alpha = 0.3;
  private lastFilteredValue = 0;

  filterSignal(signal: number[]): number[] {
    if (signal.length === 0) return [];

    const filtered: number[] = [];
    
    // Aplicar filtro de media móvil
    for (let i = 0; i < signal.length; i++) {
      const windowStart = Math.max(0, i - this.windowSize + 1);
      const window = signal.slice(windowStart, i + 1);
      const movingAverage = window.reduce((a, b) => a + b, 0) / window.length;
      
      // Aplicar filtro exponencial
      this.lastFilteredValue = this.alpha * movingAverage + 
                              (1 - this.alpha) * this.lastFilteredValue;
      
      filtered.push(this.lastFilteredValue);
    }

    console.log('🔧 Filtrado de señal:', {
      señalOriginal: signal,
      señalFiltrada: filtered,
      ventana: this.windowSize,
      alfa: this.alpha
    });

    return filtered;
  }

  reset() {
    this.lastFilteredValue = 0;
  }
}
