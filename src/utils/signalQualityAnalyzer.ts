
export class SignalQualityAnalyzer {
  // Configuración optimizada para análisis de calidad PPG
  private readonly config = {
    metrics: {
      snr: { min: 4.0, optimal: 8.0 },
      stability: { min: 0.85, optimal: 0.95 },
      perfusion: { min: 0.5, optimal: 2.0 },
      artifacts: { max: 0.1 }
    },
    signal: {
      minAmplitude: 20,
      maxNoise: 0.3,
      minDynamicRange: 0.15
    },
    analysis: {
      windowSize: 30,
      minValidFrames: 4,
      smoothingFactor: 0.85
    }
  };

  private lastQualityValue = 0;

  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < this.config.analysis.minValidFrames) return 0;

    try {
      // 1. Análisis de amplitud y rango dinámico
      const { amplitudeQuality, dynamicRange } = this.analyzeAmplitude(signal);
      if (amplitudeQuality < 0.2) return 0;

      // 2. Análisis de estabilidad y ruido
      const stabilityScore = this.analyzeStability(signal);
      const noiseScore = this.analyzeNoise(signal);

      // 3. Cálculo de perfusión
      const perfusionScore = this.calculatePerfusion(signal);

      // 4. Cálculo de calidad final
      const rawQuality = this.calculateWeightedQuality({
        amplitude: amplitudeQuality,
        stability: stabilityScore,
        noise: noiseScore,
        perfusion: perfusionScore,
        range: dynamicRange
      });

      // 5. Suavizado temporal para evitar cambios bruscos
      this.lastQualityValue = (this.config.analysis.smoothingFactor * this.lastQualityValue) +
                             ((1 - this.config.analysis.smoothingFactor) * rawQuality);

      return this.lastQualityValue;

    } catch (error) {
      console.error('Error en análisis de calidad:', error);
      return 0;
    }
  }

  private analyzeAmplitude(signal: number[]): { amplitudeQuality: number; dynamicRange: number } {
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const amplitude = max - min;
    
    const dynamicRange = amplitude / (Math.max(Math.abs(max), Math.abs(min)) + 1e-6);
    const amplitudeQuality = Math.min(1, Math.max(0, amplitude / this.config.signal.minAmplitude));

    return { amplitudeQuality, dynamicRange };
  }

  private analyzeStability(signal: number[]): number {
    if (signal.length < 3) return 0;

    const differences = [];
    for (let i = 1; i < signal.length; i++) {
      differences.push(Math.abs(signal[i] - signal[i - 1]));
    }

    const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    const maxSignal = Math.max(...signal);
    
    return Math.max(0, 1 - (meanDiff / (maxSignal + 1e-6)));
  }

  private analyzeNoise(signal: number[]): number {
    if (signal.length < 3) return 0;

    // Estimación de SNR usando varianza de la señal y del ruido
    const signalMean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const signalVariance = signal.reduce((acc, val) => 
      acc + Math.pow(val - signalMean, 2), 0) / signal.length;

    const differences = signal.slice(1).map((val, i) => val - signal[i]);
    const noiseVariance = differences.reduce((acc, diff) => 
      acc + Math.pow(diff, 2), 0) / differences.length;

    const snr = signalVariance / (noiseVariance + 1e-6);
    return Math.min(1, snr / this.config.metrics.snr.optimal);
  }

  private calculatePerfusion(signal: number[]): number {
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    
    const perfusionIndex = ((max - min) / (mean + 1e-6)) * 100;
    return Math.min(1, perfusionIndex / this.config.metrics.perfusion.optimal);
  }

  private calculateWeightedQuality(metrics: {
    amplitude: number;
    stability: number;
    noise: number;
    perfusion: number;
    range: number;
  }): number {
    const weights = {
      amplitude: 0.3,
      stability: 0.25,
      noise: 0.2,
      perfusion: 0.15,
      range: 0.1
    };

    let quality = 
      metrics.amplitude * weights.amplitude +
      metrics.stability * weights.stability +
      metrics.noise * weights.noise +
      metrics.perfusion * weights.perfusion +
      (metrics.range > this.config.signal.minDynamicRange ? weights.range : 0);

    // Penalización si alguna métrica es muy baja
    const minMetricValue = Math.min(
      metrics.amplitude,
      metrics.stability,
      metrics.noise
    );

    if (minMetricValue < 0.2) {
      quality *= 0.5;
    }

    return Math.min(1, Math.max(0, quality));
  }

  calculateSignalStability(redSignal: number[], irSignal: number[]): number {
    if (redSignal.length < 2 || irSignal.length < 2) return 0;

    const redQuality = this.analyzeSignalQuality(redSignal);
    const irQuality = this.analyzeSignalQuality(irSignal);
    
    return Math.min(redQuality, irQuality);
  }
}
