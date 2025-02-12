
export class SignalQualityAnalyzer {
  private readonly windowSize = 30; // 1 segundo de datos a 30 fps
  private readonly minValidAmplitude = 0.1;
  private readonly maxValidAmplitude = 5.0;
  private readonly expectedFrequencyRange = { min: 0.5, max: 3.3 }; // Hz (30-200 BPM)

  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < this.windowSize) return 0;
    
    // Tomar la ventana más reciente
    const window = signal.slice(-this.windowSize);
    
    // 1. Análisis de Amplitud
    const amplitudeScore = this.calculateAmplitudeScore(window);
    
    // 2. Análisis de Ruido
    const noiseScore = this.calculateNoiseScore(window);
    
    // 3. Análisis de Regularidad
    const regularityScore = this.calculateRegularityScore(window);
    
    // 4. Análisis de Frecuencia
    const frequencyScore = this.calculateFrequencyScore(window);

    // Ponderación de los diferentes aspectos de la calidad
    const qualityScore = (
      amplitudeScore * 0.3 +
      noiseScore * 0.3 +
      regularityScore * 0.2 +
      frequencyScore * 0.2
    );

    console.log('Análisis de calidad de señal:', {
      amplitudeScore: Math.round(amplitudeScore * 100) / 100,
      noiseScore: Math.round(noiseScore * 100) / 100,
      regularityScore: Math.round(regularityScore * 100) / 100,
      frequencyScore: Math.round(frequencyScore * 100) / 100,
      qualityScore: Math.round(qualityScore * 100) / 100
    });

    return Math.min(Math.max(qualityScore, 0), 1);
  }

  calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    if (redSignal.length < 2 || irSignal.length < 2) return 0;

    const redStability = this.calculateStabilityMetric(redSignal);
    const irStability = this.calculateStabilityMetric(irSignal);
    
    // Promedio ponderado de estabilidad
    const stability = (redStability * 0.6 + irStability * 0.4);
    
    console.log('Estabilidad de señal:', {
      red: Math.round(redStability * 100) / 100,
      ir: Math.round(irStability * 100) / 100,
      combined: Math.round(stability * 100) / 100
    });

    return Math.min(Math.max(stability, 0), 1);
  }

  private calculateAmplitudeScore(signal: number[]): number {
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const amplitude = max - min;
    
    if (amplitude < this.minValidAmplitude) return 0;
    if (amplitude > this.maxValidAmplitude) return 0;
    
    // Normalizar a un rango óptimo
    const normalizedAmplitude = Math.min(amplitude / 2, 1);
    return normalizedAmplitude;
  }

  private calculateNoiseScore(signal: number[]): number {
    const differences = [];
    for (let i = 1; i < signal.length; i++) {
      differences.push(Math.abs(signal[i] - signal[i-1]));
    }
    
    const averageDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
    const variance = differences.reduce((a, b) => a + Math.pow(b - averageDifference, 2), 0) / differences.length;
    
    // Menor varianza indica menos ruido
    const noiseScore = Math.exp(-variance * 2);
    return noiseScore;
  }

  private calculateRegularityScore(signal: number[]): number {
    const peaks = this.findPeaks(signal);
    if (peaks.length < 2) return 0;
    
    // Calcular intervalos entre picos
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i-1]);
    }
    
    // Calcular variabilidad de intervalos
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const intervalVariability = intervals.reduce((a, b) => a + Math.abs(b - avgInterval), 0) / intervals.length;
    
    return Math.exp(-intervalVariability / avgInterval);
  }

  private calculateFrequencyScore(signal: number[]): number {
    const dominantFrequency = this.estimateDominantFrequency(signal);
    
    if (dominantFrequency < this.expectedFrequencyRange.min || 
        dominantFrequency > this.expectedFrequencyRange.max) {
      return 0;
    }
    
    // Normalizar dentro del rango esperado
    const normalizedFreq = (dominantFrequency - this.expectedFrequencyRange.min) / 
                          (this.expectedFrequencyRange.max - this.expectedFrequencyRange.min);
    
    return 1 - Math.abs(0.5 - normalizedFreq) * 2;
  }

  private findPeaks(signal: number[]): number[] {
    const peaks = [];
    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i-1] && signal[i] > signal[i+1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  private estimateDominantFrequency(signal: number[]): number {
    const sampleRate = 30; // Hz
    let maxPower = 0;
    let dominantFreq = 0;
    
    // Implementación simple de análisis de frecuencia
    for (let freq = this.expectedFrequencyRange.min; 
         freq <= this.expectedFrequencyRange.max; 
         freq += 0.1) {
      let power = 0;
      for (let t = 0; t < signal.length; t++) {
        const time = t / sampleRate;
        power += signal[t] * Math.sin(2 * Math.PI * freq * time);
      }
      power = Math.abs(power);
      
      if (power > maxPower) {
        maxPower = power;
        dominantFreq = freq;
      }
    }
    
    return dominantFreq;
  }

  private calculateStabilityMetric(signal: number[]): number {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const cv = Math.sqrt(variance) / mean; // Coeficiente de variación
    
    // Normalizar el CV a un score entre 0 y 1
    return Math.exp(-cv * 2);
  }
}
