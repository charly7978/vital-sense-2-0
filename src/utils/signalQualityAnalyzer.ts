
export class SignalQualityAnalyzer {
  analyzeSignalQuality(signal: number[]): number {
    if (signal.length === 0) return 0;
    
    // Análisis instantáneo basado en el último valor de la señal
    const currentValue = signal[signal.length - 1];
    
    // Normalización simple basada en la amplitud instantánea
    // Valores típicos de PPG están entre 0 y 1000
    const normalizedQuality = Math.min(Math.max(currentValue / 1000, 0), 1);
    
    return normalizedQuality;
  }
}
