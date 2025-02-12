
export class SignalQualityAnalyzer {
  analyzeSignalQuality(signal: number[]): number {
    // Si no hay señal, retornamos 0
    if (!signal || signal.length === 0) return 0;
    
    // Tomamos el último valor de la señal (el más reciente)
    const latestValue = signal[signal.length - 1];
    
    // Normalizamos el valor al rango 0-1
    // Los valores típicos de PPG están entre 0-255
    return Math.min(Math.max(latestValue / 255, 0), 1);
  }
}
