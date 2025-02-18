export class SignalQualityAnalyzer {
  // OPTIMIZACIÓN: Umbrales más estrictos para mejor calidad
  private readonly MIN_AMPLITUDE = 30;        // Antes: 20
  private readonly MIN_VARIATION = 0.08;      // Antes: 0.05
  private readonly WINDOW_SIZE = 15;          // Antes: 8
  private readonly STABILITY_THRESHOLD = 0.5;
  private readonly NOISE_SENSITIVITY = 1.2;
  private lastQuality = 0;

  // OPTIMIZACIÓN: Mejor análisis de calidad de señal
  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 2) return 0;
    
    // OPTIMIZACIÓN: Estadísticas mejoradas
    const { mean, stdDev, variance } = this.calculateStatistics(signal);
    
    // OPTIMIZACIÓN: Mejor análisis de amplitud
    const { peakToPeak, amplitudeQuality } = this.analyzeAmplitude(signal);
    if (peakToPeak < this.MIN_AMPLITUDE) {
      return this.smoothQuality(0.1);
    }
    
    // OPTIMIZACIÓN: Análisis de ruido mejorado
    const noiseLevel = this.calculateNoiseLevel(signal);
    
    // OPTIMIZACIÓN: Mejor análisis de línea base
    const baselineStability = this.calculateBaselineStability(signal);
    
    // OPTIMIZACIÓN: Mejor análisis de variación
    const signalVariation = stdDev / (Math.abs(mean) + 1e-6);
    if (signalVariation < this.MIN_VARIATION) {
      return this.smoothQuality(0.1);
    }
    
    // OPTIMIZACIÓN: Pesos ajustados para mejor detección
    const weights = {
      amplitude: 0.3,    // Antes: 0.35
      noise: 0.4,        // Antes: 0.35
      baseline: 0.3      // Antes: 0.3
    };
    
    // OPTIMIZACIÓN: Cálculo de calidad mejorado
    const noiseQuality = 1 - Math.min(noiseLevel * this.NOISE_SENSITIVITY, 1);
    const baselineQuality = Math.min(baselineStability, 1);
    
    let quality = 
      amplitudeQuality * weights.amplitude +
      noiseQuality * weights.noise +
      baselineQuality * weights.baseline;
    
    // OPTIMIZACIÓN: Penalización por inestabilidad
    if (baselineStability < this.STABILITY_THRESHOLD) {
      quality *= 0.8;
    }
    
    // OPTIMIZACIÓN: Ajuste exponencial mejorado
    quality = Math.pow(quality, 1.2);
    
    // OPTIMIZACIÓN: Suavizado temporal
    return this.smoothQuality(quality);
  }

  // OPTIMIZACIÓN: Mejor cálculo de estadísticas
  private calculateStatistics(signal: number[]) {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const stdDev = Math.sqrt(variance);
    return { mean, variance, stdDev };
  }

  // OPTIMIZACIÓN: Mejor análisis de amplitud
  private analyzeAmplitude(signal: number[]) {
    const peakToPeak = Math.max(...signal) - Math.min(...signal);
    const amplitudeQuality = Math.min(peakToPeak / 150, 1);
    return { peakToPeak, amplitudeQuality };
  }

  // OPTIMIZACIÓN: Cálculo de ruido mejorado
  private calculateNoiseLevel(signal: number[]): number {
    if (signal.length < 2) return 1;

    // OPTIMIZACIÓN: Análisis de primer y segundo orden
    const firstOrderDiff = [];
    for (let i = 1; i < signal.length; i++) {
      firstOrderDiff.push(Math.abs(signal[i] - signal[i-1]));
    }
    
    const secondOrderDiff = [];
    for (let i = 1; i < firstOrderDiff.length; i++) {
      secondOrderDiff.push(Math.abs(firstOrderDiff[i] - firstOrderDiff[i-1]));
    }
    
    const meanFirstOrder = firstOrderDiff.reduce((a, b) => a + b, 0) / firstOrderDiff.length;
    const meanSecondOrder = secondOrderDiff.reduce((a, b) => a + b, 0) / secondOrderDiff.length;
    
    const maxSignal = Math.max(...signal) - Math.min(...signal);
    if (maxSignal === 0) return 1;
    
    // OPTIMIZACIÓN: Combinación ponderada de ruidos
    return (meanFirstOrder * 0.7 + meanSecondOrder * 0.3) / maxSignal;
  }

  // OPTIMIZACIÓN: Mejor estabilidad de línea base
  private calculateBaselineStability(signal: number[]): number {
    if (signal.length < this.WINDOW_SIZE) return 0;
    
    const baseline = this.calculateBaseline(signal);
    const baselineVariation = this.calculateBaselineVariation(baseline);
    
    // OPTIMIZACIÓN: Normalización mejorada
    return Math.exp(-baselineVariation / 5);
  }

  // OPTIMIZACIÓN: Mejor cálculo de línea base
  private calculateBaseline(signal: number[]): number[] {
    const baseline = [];
    const windowSize = this.WINDOW_SIZE;
    
    for (let i = windowSize; i < signal.length; i++) {
      let weightedSum = 0;
      let weightSum = 0;
      
      for (let j = 0; j < windowSize; j++) {
        const weight = Math.exp(-j/5);  // Peso exponencial
        weightedSum += signal[i-j] * weight;
        weightSum += weight;
      }
      
      baseline.push(weightedSum / weightSum);
    }
    
    return baseline;
  }

  // OPTIMIZACIÓN: Mejor cálculo de variación
  private calculateBaselineVariation(baseline: number[]): number {
    const trend = this.calculateTrend(baseline);
    
    return baseline.reduce((acc, val, i) => 
      acc + Math.pow(val - trend[i], 2), 0
    ) / baseline.length;
  }

  // OPTIMIZACIÓN: Mejor cálculo de tendencia
  private calculateTrend(signal: number[]): number[] {
    const trend = [];
    const windowSize = Math.min(15, Math.floor(signal.length / 3));
    
    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(signal.length, i + windowSize + 1);
      const segment = signal.slice(start, end);
      trend.push(segment.reduce((a, b) => a + b, 0) / segment.length);
    }
    
    return trend;
  }

  // OPTIMIZACIÓN: Suavizado temporal mejorado
  private smoothQuality(newQuality: number): number {
    const alpha = 0.3; // Factor de suavizado
    this.lastQuality = alpha * newQuality + (1 - alpha) * this.lastQuality;
    return Math.min(Math.max(this.lastQuality, 0), 1);
  }

  // OPTIMIZACIÓN: Mejor cálculo de estabilidad entre señales
  calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    if (redSignal.length < 2 || irSignal.length < 2) return 0;

    const redQuality = this.analyzeSignalQuality(redSignal);
    const irQuality = this.analyzeSignalQuality(irSignal);
    
    // OPTIMIZACIÓN: Análisis de correlación
    const correlation = this.calculateCorrelation(redSignal, irSignal);
    
    // OPTIMIZACIÓN: Combinación ponderada
    return Math.min(
      redQuality * 0.4 + 
      irQuality * 0.4 + 
      correlation * 0.2,
      1
    );
  }

  // OPTIMIZACIÓN: Mejor cálculo de correlación
  private calculateCorrelation(signal1: number[], signal2: number[]): number {
    if (signal1.length !== signal2.length) return 0;
    
    const { mean: mean1, stdDev: std1 } = this.calculateStatistics(signal1);
    const { mean: mean2, stdDev: std2 } = this.calculateStatistics(signal2);
    
    let correlation = 0;
    for (let i = 0; i < signal1.length; i++) {
      correlation += 
        ((signal1[i] - mean1) / std1) * 
        ((signal2[i] - mean2) / std2);
    }
    
    correlation /= signal1.length;
    return Math.max(0, correlation);
  }
}
