
export class SignalQualityAnalyzer {
  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    // 1. Calculamos la amplitud de la señal
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const amplitude = max - min;
    
    // 2. Calculamos la media y la desviación estándar
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const standardDeviation = Math.sqrt(variance);
    
    // 3. Calculamos el ruido de alta frecuencia
    const highFreqNoise = this.calculateHighFrequencyNoise(signal);
    
    // 4. Calculamos la relación señal-ruido (SNR)
    const snr = amplitude / (standardDeviation + 0.0001); // Evitamos división por cero
    
    // 5. Normalizamos cada métrica entre 0 y 1
    const amplitudeQuality = Math.min(amplitude / 1000, 1);
    const snrQuality = Math.min(snr / 10, 1);
    const noiseQuality = Math.max(1 - highFreqNoise, 0);
    
    // 6. Combinamos las métricas para obtener la calidad final
    const quality = (
      amplitudeQuality * 0.4 + 
      snrQuality * 0.4 + 
      noiseQuality * 0.2
    );
    
    // Aseguramos que el resultado esté entre 0 y 1
    return Math.min(Math.max(quality, 0), 1);
  }

  private calculateHighFrequencyNoise(signal: number[]): number {
    let totalVariation = 0;
    
    // Calculamos la variación punto a punto
    for (let i = 1; i < signal.length; i++) {
      const variation = Math.abs(signal[i] - signal[i-1]);
      totalVariation += variation;
    }
    
    // Normalizamos por la longitud de la señal
    return totalVariation / (signal.length - 1);
  }

  calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    const redStability = this.calculateStabilityMetric(redSignal);
    const irStability = this.calculateStabilityMetric(irSignal);
    
    return Math.min(redStability, irStability);
  }

  private calculateStabilityMetric(signal: number[]): number {
    if (signal.length < 2) return 0;

    // Calculamos la variación total de la señal
    let totalVariation = 0;
    for (let i = 1; i < signal.length; i++) {
      totalVariation += Math.abs(signal[i] - signal[i-1]);
    }
    
    // Normalizamos por el rango de la señal
    const range = Math.max(...signal) - Math.min(...signal);
    if (range === 0) return 0;
    
    const stability = 1 - (totalVariation / (range * signal.length));
    return Math.max(Math.min(stability, 1), 0);
  }
}
