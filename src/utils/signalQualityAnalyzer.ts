
export class SignalQualityAnalyzer {
  private readonly windowSize = 30;
  private readonly artifactThreshold = 0.4;
  private readonly minValidAmplitude = 20;
  private readonly maxNoiseTolerance = 0.3;
  private readonly minSignalDynamicRange = 0.15;
  private readonly smoothingFactor = 0.85;
  private lastQualityValue = 0;

  analyzeSignalQuality(signal: number[]): number {
    if (signal.length < 4) return 0;

    try {
      // 1. Análisis de Amplitud y Rango Dinámico
      const { amplitudeQuality, dynamicRange } = this.analyzeAmplitude(signal);
      if (amplitudeQuality < 0.2) return 0.1; // Señal muy débil

      // 2. Detección de Artefactos y Ruido
      const noiseQuality = this.analyzeNoise(signal);
      
      // 3. Análisis de Forma de Onda
      const waveformQuality = this.analyzeWaveform(signal);
      
      // 4. Estabilidad de línea base
      const baselineStability = this.calculateBaselineStability(signal);
      
      // 5. Consistencia de Intervalos
      const rhythmStability = this.analyzeRhythmStability(signal);

      // 6. Cálculo de calidad final con pesos optimizados
      const rawQuality = this.calculateWeightedQuality({
        amplitudeQuality,
        noiseQuality,
        waveformQuality,
        baselineStability,
        rhythmStability,
        dynamicRange
      });

      // 7. Suavizado exponencial para evitar cambios bruscos
      this.lastQualityValue = (this.smoothingFactor * this.lastQualityValue) + 
                             ((1 - this.smoothingFactor) * rawQuality);

      // 8. Logging detallado para depuración
      console.log('Métricas de calidad:', {
        amplitud: amplitudeQuality.toFixed(2),
        ruido: noiseQuality.toFixed(2),
        forma: waveformQuality.toFixed(2),
        baseline: baselineStability.toFixed(2),
        ritmo: rhythmStability.toFixed(2),
        rangoD: dynamicRange.toFixed(2),
        calidadFinal: this.lastQualityValue.toFixed(2)
      });

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
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    
    // Rango dinámico normalizado
    const dynamicRange = amplitude / (max + Number.EPSILON);
    
    // Calidad basada en amplitud con umbral mínimo
    const amplitudeQuality = Math.min(
      1, 
      Math.max(0, (amplitude - this.minValidAmplitude) / 100)
    );

    return { amplitudeQuality, dynamicRange };
  }

  private analyzeNoise(signal: number[]): number {
    if (signal.length < 3) return 0;

    // Cálculo de ruido de alta frecuencia usando diferencias de primer orden
    const differences = signal.slice(1).map((val, i) => Math.abs(val - signal[i]));
    const meanDiff = differences.reduce((a, b) => a + b, 0) / differences.length;
    
    // Estimación de SNR simplificada
    const signalPower = signal.reduce((a, b) => a + b * b, 0) / signal.length;
    const noisePower = differences.reduce((a, b) => a + b * b, 0) / differences.length;
    
    const snr = signalPower / (noisePower + Number.EPSILON);
    const noiseQuality = Math.min(1, Math.max(0, 1 - (meanDiff / this.maxNoiseTolerance)));

    return Math.min(1, Math.max(0, (snr * noiseQuality)));
  }

  private analyzeWaveform(signal: number[]): number {
    if (signal.length < this.windowSize) return 0;

    let qualityScore = 0;
    const segments = Math.floor(signal.length / this.windowSize);

    for (let i = 0; i < segments; i++) {
      const segment = signal.slice(i * this.windowSize, (i + 1) * this.windowSize);
      const segmentQuality = this.analyzeSegmentMorphology(segment);
      qualityScore += segmentQuality;
    }

    return Math.min(1, qualityScore / segments);
  }

  private analyzeSegmentMorphology(segment: number[]): number {
    const max = Math.max(...segment);
    const min = Math.min(...segment);
    const mean = segment.reduce((a, b) => a + b, 0) / segment.length;
    
    // Análisis de simetría
    const upstroke = segment.findIndex(v => v === max);
    const symmetryScore = Math.abs(0.5 - (upstroke / segment.length));
    
    // Análisis de suavidad
    let smoothnessScore = 0;
    for (let i = 1; i < segment.length - 1; i++) {
      const diff1 = Math.abs(segment[i] - segment[i - 1]);
      const diff2 = Math.abs(segment[i + 1] - segment[i]);
      smoothnessScore += Math.abs(diff2 - diff1);
    }
    smoothnessScore = 1 - (smoothnessScore / (segment.length * (max - min)));

    return (symmetryScore + smoothnessScore) / 2;
  }

  private calculateBaselineStability(signal: number[]): number {
    if (signal.length < 8) return 0;
    
    const windowSize = 8;
    const baseline = [];
    
    for (let i = windowSize; i < signal.length; i++) {
      const windowMean = signal.slice(i - windowSize, i)
        .reduce((a, b) => a + b, 0) / windowSize;
      baseline.push(windowMean);
    }
    
    if (baseline.length < 2) return 0;
    
    const baselineVariation = Math.sqrt(
      baseline.reduce((acc, val) => acc + Math.pow(val - baseline[0], 2), 0) / baseline.length
    );
    
    return Math.exp(-baselineVariation / 8);
  }

  private analyzeRhythmStability(signal: number[]): number {
    if (signal.length < 4) return 0;

    const peaks = this.findPeaks(signal);
    if (peaks.length < 2) return 0;

    const intervals = peaks.slice(1).map((peak, i) => peak - peaks[i]);
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    const variability = intervals.reduce((acc, interval) => 
      acc + Math.pow(interval - meanInterval, 2), 0) / intervals.length;

    return Math.exp(-variability / (meanInterval * 2));
  }

  private findPeaks(signal: number[]): number[] {
    const peaks: number[] = [];
    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i - 1] && signal[i] > signal[i + 1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  private calculateWeightedQuality(metrics: {
    amplitudeQuality: number;
    noiseQuality: number;
    waveformQuality: number;
    baselineStability: number;
    rhythmStability: number;
    dynamicRange: number;
  }): number {
    const weights = {
      amplitude: 0.25,
      noise: 0.20,
      waveform: 0.20,
      baseline: 0.15,
      rhythm: 0.10,
      range: 0.10
    };

    let quality = 
      metrics.amplitudeQuality * weights.amplitude +
      metrics.noiseQuality * weights.noise +
      metrics.waveformQuality * weights.waveform +
      metrics.baselineStability * weights.baseline +
      metrics.rhythmStability * weights.rhythm +
      (metrics.dynamicRange > this.minSignalDynamicRange ? weights.range : 0);

    // Penalización si alguna métrica es muy baja
    const minMetricValue = Math.min(
      metrics.amplitudeQuality,
      metrics.noiseQuality,
      metrics.waveformQuality,
      metrics.baselineStability
    );

    if (minMetricValue < 0.2) {
      quality *= 0.5; // Penalización significativa
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
