import {
  ArtifactConfig, ArtifactDetection, ArtifactFeatures,
  SignalQuality, MotionAnalysis, NoiseAnalysis,
  ArtifactClassification, SignalSegmentation, ArtifactMetrics,
  TemplateMatching, ArtifactValidation
} from '@/types';

/**
 * Detector avanzado de artefactos en PPG
 * Implementa técnicas de última generación en detección de artefactos
 * @version 2.0.0
 */
export class ArtifactDetector {
  // Configuración optimizada
  private readonly config: ArtifactConfig = {
    sampleRate: 30,           // Hz
    windowSize: 256,          // Muestras
    overlapSize: 128,         // Solapamiento
    
    // Análisis de movimiento
    motion: {
      enabled: true,          // Enable motion analysis
      threshold: 0.3,         // Umbral de movimiento
      window: 64,             // Ventana de análisis
      features: [
        'acceleration',       // Aceleración
        'jerk',              // Derivada de aceleración
        'displacement',       // Desplazamiento
        'energy'             // Energía de movimiento
      ],
      fusion: 'weighted'      // Fusión de características
    },

    // Análisis de ruido
    noise: {
      enabled: true,         // Enable noise analysis
      methods: [
        'snr',               // Relación señal-ruido
        'entropy',           // Entropía
        'kurtosis',          // Kurtosis
        'variance'           // Varianza
      ],
      thresholds: {
        snr: 10.0,           // dB
        entropy: 0.7,
        kurtosis: 3.0,
        variance: 0.2
      }
    },

    // Análisis wavelet
    wavelet: {
      type: 'db4',           // Wavelet Daubechies 4
      levels: 5,             // Niveles de descomposición
      threshold: 'universal', // Umbral universal
      denoising: 'soft'      // Umbralización suave
    },

    // Análisis espectral
    spectral: {
      enabled: true,         // Enable spectral analysis
      method: 'welch',       // Método de Welch
      window: 'hanning',     // Ventana Hanning
      segments: 8,           // Segmentos
      overlap: 0.5,          // Solapamiento
      bands: [
        [0.0, 0.5],         // Muy baja frecuencia
        [0.5, 4.0],         // Banda cardíaca
        [4.0, 15.0]         // Ruido de alta frecuencia
      ]
    },

    // Clasificación
    classification: {
      method: 'ensemble',    // Clasificador ensemble
      models: [
        'statistical',       // Modelo estadístico
        'template',          // Matching de plantillas
        'wavelet',          // Análisis wavelet
        'spectral'          // Análisis espectral
      ],
      weights: {
        statistical: 0.3,
        template: 0.2,
        wavelet: 0.3,
        spectral: 0.2
      }
    },

    // Validación
    validation: {
      minQuality: 0.7,       // Calidad mínima
      maxArtifacts: 0.3,     // Máximo de artefactos
      consistency: 0.8,      // Consistencia mínima
      physiological: true    // Validación fisiológica
    }
  };

  // Procesadores especializados
  private readonly motionAnalyzer: MotionAnalysis;
  private readonly noiseAnalyzer: NoiseAnalysis;
  private readonly waveletAnalyzer: WaveletAnalysis;
  private readonly spectralAnalyzer: SpectralAnalysis;
  private readonly templateMatcher: TemplateMatching;
  private readonly artifactValidator: ArtifactValidation;

  // Buffers optimizados
  private readonly buffers = {
    signal: new Float64Array(512),
    motion: new Float64Array(256),
    noise: new Float64Array(256),
    wavelet: new Float64Array(1024),
    spectral: new Float64Array(512),
    templates: new Float64Array(8 * 256)
  };

  // Estado del detector
  private readonly state = {
    lastDetection: null as ArtifactDetection | null,
    artifactHistory: [] as ArtifactFeatures[],
    qualityHistory: [] as number[],
    templates: {
      clean: [] as Float64Array[],
      artifact: [] as Float64Array[]
    },
    adaptation: {
      thresholds: new Map<string, number>(),
      weights: new Map<string, number>(),
      window: 256
    }
  };

  constructor() {
    this.initializeDetector();
  }

  /**
   * Detección principal de artefactos
   * Implementa pipeline completo de detección
   */
  public detect(signal: Float64Array): ArtifactDetection {
    try {
      // 1. Validación de señal
      if (!this.validateSignal(signal)) {
        throw new Error('Invalid signal for artifact detection');
      }

      // 2. Segmentación
      const segments = this.segmentSignal(signal);

      // 3. Análisis de movimiento
      const motion = this.analyzeMotion(segments);

      // 4. Análisis de ruido
      const noise = this.analyzeNoise(segments);

      // 5. Análisis wavelet
      const wavelet = this.analyzeWavelet(segments);

      // 6. Análisis espectral
      const spectral = this.analyzeSpectral(segments);

      // 7. Matching de plantillas
      const templates = this.matchTemplates(segments);

      // 8. Clasificación de artefactos
      const artifacts = this.classifyArtifacts({
        motion,
        noise,
        wavelet,
        spectral,
        templates
      });

      // 9. Validación
      const validated = this.validateArtifacts(artifacts);

      // 10. Extracción de características
      const features = this.extractFeatures(validated);

      // 11. Actualización de estado
      this.updateState({
        artifacts: validated,
        features,
        quality: this.calculateQuality(validated)
      });

      return {
        artifacts: validated,
        features,
        segments,
        quality: this.calculateQuality(validated),
        metrics: this.calculateMetrics(validated)
      };

    } catch (error) {
      console.error('Error in artifact detection:', error);
      return this.handleDetectionError(error);
    }
  }

  /**
   * Análisis de movimiento
   */
  private analyzeMotion(
    segments: Float64Array[]
  ): MotionAnalysis {
    const features = segments.map(segment => {
      // 1. Características de movimiento
      const acceleration = this.calculateAcceleration(segment);
      const jerk = this.calculateJerk(acceleration);
      const displacement = this.calculateDisplacement(acceleration);
      const energy = this.calculateEnergy(segment);

      // 2. Fusión de características
      return this.fuseMotionFeatures({
        acceleration,
        jerk,
        displacement,
        energy
      });
    });

    return {
      features,
      threshold: this.config.motion.threshold,
      detection: this.detectMotionArtifacts(features)
    };
  }

  /**
   * Análisis de ruido
   */
  private analyzeNoise(
    segments: Float64Array[]
  ): NoiseAnalysis {
    return segments.map(segment => {
      const analysis = {} as NoiseAnalysis;

      // 1. SNR
      if (this.config.noise.methods.includes('snr')) {
        analysis.snr = this.calculateSNR(segment);
      }

      // 2. Entropía
      if (this.config.noise.methods.includes('entropy')) {
        analysis.entropy = this.calculateEntropy(segment);
      }

      // 3. Kurtosis
      if (this.config.noise.methods.includes('kurtosis')) {
        analysis.kurtosis = this.calculateKurtosis(segment);
      }

      // 4. Varianza
      if (this.config.noise.methods.includes('variance')) {
        analysis.variance = this.calculateVariance(segment);
      }

      return {
        ...analysis,
        isNoisy: this.evaluateNoiseMetrics(analysis)
      };
    });
  }

  /**
   * Optimizaciones de bajo nivel
   */
  private segmentSignal(
    signal: Float64Array
  ): Float64Array[] {
    const segments: Float64Array[] = [];
    const windowSize = this.config.windowSize;
    const overlapSize = this.config.overlapSize;
    const step = windowSize - overlapSize;

    // Segmentación vectorizada
    for (let i = 0; i < signal.length - windowSize; i += step) {
      const segment = new Float64Array(windowSize);
      segment.set(signal.subarray(i, i + windowSize));
      segments.push(segment);
    }

    return segments;
  }

  /**
   * Gestión de estado
   */
  private updateState(data: {
    artifacts: ArtifactFeatures[];
    features: ArtifactMetrics;
    quality: SignalQuality;
  }): void {
    // 1. Actualización de última detección
    this.state.lastDetection = {
      artifacts: data.artifacts,
      features: data.features,
      quality: data.quality,
      timestamp: Date.now()
    };

    // 2. Actualización de historiales
    this.state.artifactHistory.push(...data.artifacts);
    this.state.qualityHistory.push(data.quality.overall);

    // 3. Mantenimiento de historiales
    if (this.state.artifactHistory.length > 100) {
      this.state.artifactHistory = this.state.artifactHistory.slice(-100);
      this.state.qualityHistory = this.state.qualityHistory.slice(-100);
    }

    // 4. Actualización de plantillas
    if (data.quality.overall > this.config.validation.minQuality) {
      this.updateTemplates(data.artifacts);
    }

    // 5. Adaptación de parámetros
    this.adaptParameters(data.quality);
  }

  /**
   * Gestión de recursos
   */
  public dispose(): void {
    try {
      // 1. Limpieza de procesadores
      this.motionAnalyzer.dispose();
      this.noiseAnalyzer.dispose();
      this.waveletAnalyzer.dispose();
      this.spectralAnalyzer.dispose();
      this.templateMatcher.dispose();
      this.artifactValidator.dispose();

      // 2. Limpieza de buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // 3. Limpieza de estado
      this.state.lastDetection = null;
      this.state.artifactHistory = [];
      this.state.qualityHistory = [];
      this.state.templates = {
        clean: [],
        artifact: []
      };
      this.state.adaptation = {
        thresholds: new Map(),
        weights: new Map(),
        window: 256
      };

    } catch (error) {
      console.error('Error in dispose:', error);
    }
  }
}
