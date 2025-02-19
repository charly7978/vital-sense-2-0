import {
  QualityConfig, QualityMetrics, SignalFeatures,
  NoiseAnalysis, ArtifactDetection, SignalStability,
  FrequencyContent, PhaseAnalysis, AmplitudeAnalysis,
  QualityScore, ValidationResult, ConfidenceLevel,
  SpectralDensity, WaveletDecomposition
} from '@/types';

/**
 * Analizador avanzado de calidad de señal PPG
 * Implementa técnicas de última generación para validación de señal
 * @version 2.0.0
 */
export class SignalQualityAnalyzer {
  // Configuración optimizada
  private readonly config: QualityConfig = {
    windowSize: 256,        // Muestras
    overlapSize: 128,       // Solapamiento
    minQuality: 0.7,        // 0-1
    maxNoise: 0.3,         // 0-1
    
    // Configuración de análisis
    analysis: {
      snrThreshold: 10.0,   // dB
      stabilityThreshold: 0.8,
      artifactThreshold: 0.2,
      frequencyBands: {
        noise: [0.0, 0.5],   // Hz
        respiratory: [0.5, 1.0],
        cardiac: [1.0, 2.5],
        harmonic: [2.5, 5.0]
      }
    },

    // Configuración de validación
    validation: {
      minAmplitude: 0.1,
      maxAmplitude: 2.0,
      minFrequency: 0.8,    // Hz
      maxFrequency: 2.5,    // Hz
      phaseCoherence: 0.7,
      waveformStability: 0.8
    },

    // Pesos de métricas
    weights: {
      snr: 0.3,
      stability: 0.2,
      artifacts: 0.2,
      frequency: 0.15,
      amplitude: 0.15
    },

    // Configuración de wavelet
    wavelet: {
      type: 'db4',
      levels: 5,
      threshold: 'sure',
      noiseEstimate: 'mad'
    }
  };

  // Procesadores especializados
  private readonly noiseAnalyzer: NoiseAnalysis;
  private readonly artifactDetector: ArtifactDetection;
  private readonly stabilityAnalyzer: SignalStability;
  private readonly frequencyAnalyzer: FrequencyContent;
  private readonly phaseAnalyzer: PhaseAnalysis;
  private readonly amplitudeAnalyzer: AmplitudeAnalysis;

  // Buffers optimizados
  private readonly buffers = {
    signal: new Float64Array(1024),
    noise: new Float64Array(1024),
    spectrum: new Float64Array(512),
    wavelets: new Float64Array(1024),
    features: new Float64Array(64),
    metrics: new Float64Array(32)
  };

  // Cache y estado
  private readonly metricsHistory: QualityMetrics[] = [];
  private readonly featureCache = new Map<string, SignalFeatures>();
  private lastValidSignal: Float64Array | null = null;

  constructor() {
    this.initializeAnalyzer();
  }

  /**
   * Análisis principal de calidad
   * Implementa pipeline completo de validación
   */
  public analyze(signal: Float64Array): QualityMetrics {
    try {
      // 1. Validación de señal
      if (!this.validateSignal(signal)) {
        throw new Error('Invalid signal for quality analysis');
      }

      // 2. Extracción de características
      const features = this.extractFeatures(signal);

      // 3. Análisis de ruido
      const noise = this.analyzeNoise(signal, features);

      // 4. Detección de artefactos
      const artifacts = this.detectArtifacts(signal, features);

      // 5. Análisis de estabilidad
      const stability = this.analyzeStability(signal, features);

      // 6. Análisis frecuencial
      const frequency = this.analyzeFrequencyContent(signal);

      // 7. Análisis de fase
      const phase = this.analyzePhase(signal, frequency);

      // 8. Análisis de amplitud
      const amplitude = this.analyzeAmplitude(signal);

      // 9. Cálculo de métricas
      const metrics = this.calculateMetrics({
        noise,
        artifacts,
        stability,
        frequency,
        phase,
        amplitude
      });

      // 10. Validación de calidad
      const validation = this.validateQuality(metrics);

      // 11. Actualización de estado
      this.updateState(signal, metrics, validation);

      return {
        metrics,
        validation,
        features,
        confidence: this.calculateConfidence(metrics)
      };

    } catch (error) {
      console.error('Error in quality analysis:', error);
      return this.handleAnalysisError(error);
    }
  }

  /**
   * Extracción avanzada de características
   */
  private extractFeatures(signal: Float64Array): SignalFeatures {
    // 1. Características temporales
    const temporal = this.extractTemporalFeatures(signal);

    // 2. Características frecuenciales
    const spectral = this.extractSpectralFeatures(signal);

    // 3. Características wavelet
    const wavelet = this.extractWaveletFeatures(signal);

    // 4. Características morfológicas
    const morphological = this.extractMorphologicalFeatures(signal);

    // 5. Características estadísticas
    const statistical = this.extractStatisticalFeatures(signal);

    return {
      temporal,
      spectral,
      wavelet,
      morphological,
      statistical
    };
  }

  /**
   * Análisis avanzado de ruido
   */
  private analyzeNoise(
    signal: Float64Array,
    features: SignalFeatures
  ): NoiseAnalysis {
    // 1. Estimación de SNR
    const snr = this.estimateSNR(signal);

    // 2. Análisis espectral de ruido
    const spectralNoise = this.analyzeSpectralNoise(
      features.spectral
    );

    // 3. Análisis wavelet de ruido
    const waveletNoise = this.analyzeWaveletNoise(
      features.wavelet
    );

    // 4. Detección de impulsos
    const impulseNoise = this.detectImpulseNoise(signal);

    // 5. Análisis de baseline
    const baselineNoise = this.analyzeBaselineNoise(signal);

    return {
      snr,
      spectralNoise,
      waveletNoise,
      impulseNoise,
      baselineNoise,
      overall: this.calculateOverallNoise([
        snr,
        spectralNoise,
        waveletNoise,
        impulseNoise,
        baselineNoise
      ])
    };
  }

  /**
   * Detección avanzada de artefactos
   */
  private detectArtifacts(
    signal: Float64Array,
    features: SignalFeatures
  ): ArtifactDetection {
    // 1. Detección de movimiento
    const motion = this.detectMotionArtifacts(signal);

    // 2. Detección de saturación
    const saturation = this.detectSaturation(signal);

    // 3. Detección de pérdida de señal
    const signalLoss = this.detectSignalLoss(signal);

    // 4. Detección de interferencias
    const interference = this.detectInterference(
      features.spectral
    );

    // 5. Detección de outliers
    const outliers = this.detectOutliers(signal);

    return {
      motion,
      saturation,
      signalLoss,
      interference,
      outliers,
      overall: this.calculateOverallArtifacts([
        motion,
        saturation,
        signalLoss,
        interference,
        outliers
      ])
    };
  }

  /**
   * Análisis de estabilidad
   */
  private analyzeStability(
    signal: Float64Array,
    features: SignalFeatures
  ): SignalStability {
    // 1. Estabilidad temporal
    const temporal = this.analyzeTemporalStability(signal);

    // 2. Estabilidad frecuencial
    const spectral = this.analyzeSpectralStability(
      features.spectral
    );

    // 3. Estabilidad de fase
    const phase = this.analyzePhaseStability(signal);

    // 4. Estabilidad morfológica
    const morphological = this.analyzeMorphologicalStability(
      features.morphological
    );

    // 5. Estabilidad estadística
    const statistical = this.analyzeStatisticalStability(
      features.statistical
    );

    return {
      temporal,
      spectral,
      phase,
      morphological,
      statistical,
      overall: this.calculateOverallStability([
        temporal,
        spectral,
        phase,
        morphological,
        statistical
      ])
    };
  }

  /**
   * Análisis de contenido frecuencial
   */
  private analyzeFrequencyContent(signal: Float64Array): FrequencyContent {
    // 1. Análisis espectral
    const spectrum = this.computeSpectrum(signal);

    // 2. Análisis de bandas
    const bands = this.analyzeBands(spectrum);

    // 3. Análisis de armónicos
    const harmonics = this.analyzeHarmonics(spectrum);

    // 4. Análisis de coherencia
    const coherence = this.analyzeSpectralCoherence(spectrum);

    // 5. Análisis de estacionariedad
    const stationarity = this.analyzeStationarity(spectrum);

    return {
      spectrum,
      bands,
      harmonics,
      coherence,
      stationarity,
      overall: this.calculateFrequencyQuality([
        bands,
        harmonics,
        coherence,
        stationarity
      ])
    };
  }

  /**
   * Validación de calidad
   */
  private validateQuality(metrics: QualityMetrics): ValidationResult {
    // 1. Validación de SNR
    const snrValid = metrics.noise.snr > this.config.analysis.snrThreshold;

    // 2. Validación de estabilidad
    const stabilityValid = metrics.stability.overall > 
      this.config.validation.waveformStability;

    // 3. Validación de artefactos
    const artifactsValid = metrics.artifacts.overall < 
      this.config.analysis.artifactThreshold;

    // 4. Validación frecuencial
    const frequencyValid = this.validateFrequencyContent(
      metrics.frequency
    );

    // 5. Validación de amplitud
    const amplitudeValid = this.validateAmplitude(
      metrics.amplitude
    );

    return {
      snrValid,
      stabilityValid,
      artifactsValid,
      frequencyValid,
      amplitudeValid,
      overall: this.calculateOverallValidation([
        snrValid,
        stabilityValid,
        artifactsValid,
        frequencyValid,
        amplitudeValid
      ])
    };
  }

  /**
   * Cálculo de confianza
   */
  private calculateConfidence(metrics: QualityMetrics): ConfidenceLevel {
    // 1. Confianza basada en ruido
    const noiseConfidence = this.calculateNoiseConfidence(
      metrics.noise
    );

    // 2. Confianza basada en estabilidad
    const stabilityConfidence = this.calculateStabilityConfidence(
      metrics.stability
    );

    // 3. Confianza basada en artefactos
    const artifactConfidence = this.calculateArtifactConfidence(
      metrics.artifacts
    );

    // 4. Confianza frecuencial
    const frequencyConfidence = this.calculateFrequencyConfidence(
      metrics.frequency
    );

    // 5. Confianza de amplitud
    const amplitudeConfidence = this.calculateAmplitudeConfidence(
      metrics.amplitude
    );

    return {
      noise: noiseConfidence,
      stability: stabilityConfidence,
      artifacts: artifactConfidence,
      frequency: frequencyConfidence,
      amplitude: amplitudeConfidence,
      overall: this.calculateOverallConfidence([
        noiseConfidence,
        stabilityConfidence,
        artifactConfidence,
        frequencyConfidence,
        amplitudeConfidence
      ])
    };
  }

  /**
   * Optimizaciones de bajo nivel
   */
  private computeSpectrum(signal: Float64Array): SpectralDensity {
    const spectrum = new Float64Array(this.buffers.spectrum.length);
    
    // FFT optimizada
    const fft = this.computeOptimizedFFT(signal);
    
    // Cálculo de densidad espectral
    for (let i = 0; i < spectrum.length; i++) {
      const real = fft[i * 2];
      const imag = fft[i * 2 + 1];
      spectrum[i] = (real * real + imag * imag) / spectrum.length;
    }
    
    return {
      frequencies: this.generateFrequencyAxis(),
      magnitudes: spectrum,
      resolution: this.config.windowSize
    };
  }

  private computeWaveletDecomposition(
    signal: Float64Array
  ): WaveletDecomposition {
    const coefficients = new Float64Array(signal.length);
    const details = new Array(this.config.wavelet.levels)
      .fill(null)
      .map(() => new Float64Array(signal.length));
    
    // Descomposición wavelet
    let current = signal;
    for (let level = 0; level < this.config.wavelet.levels; level++) {
      const { approximation, detail } = this.waveletStep(
        current,
        level
      );
      
      details[level].set(detail);
      current = approximation;
    }
    
    coefficients.set(current);
    
    return {
      coefficients,
      details,
      levels: this.config.wavelet.levels
    };
  }

  /**
   * Gestión de estado
   */
  private updateState(
    signal: Float64Array,
    metrics: QualityMetrics,
    validation: ValidationResult
  ): void {
    // 1. Actualización de historial
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > 30) {
      this.metricsHistory.shift();
    }

    // 2. Actualización de última señal válida
    if (validation.overall) {
      this.lastValidSignal = signal.slice();
    }

    // 3. Limpieza de cache si necesario
    if (this.featureCache.size > 100) {
      const oldestKey = this.featureCache.keys().next().value;
      this.featureCache.delete(oldestKey);
    }
  }

  /**
   * Gestión de recursos
   */
  public dispose(): void {
    try {
      // 1. Limpieza de procesadores
      this.noiseAnalyzer.dispose();
      this.artifactDetector.dispose();
      this.stabilityAnalyzer.dispose();
      this.frequencyAnalyzer.dispose();
      this.phaseAnalyzer.dispose();
      this.amplitudeAnalyzer.dispose();

      // 2. Limpieza de buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // 3. Limpieza de cache y estado
      this.featureCache.clear();
      this.metricsHistory.length = 0;
      this.lastValidSignal = null;

    } catch (error) {
      console.error('Error in dispose:', error);
    }
  }
}
