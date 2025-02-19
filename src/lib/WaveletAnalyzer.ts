import { WaveletConfig, VitalReading, SpectralFeatures, WaveletDecomposition } from '@/types';

/**
 * Analizador Wavelet avanzado con análisis multiresolución
 * Optimizado para detección de características PPG
 */
export class WaveletAnalyzer {
  // Configuración y estado
  private readonly config: WaveletConfig;
  private decompositionLevels: number = 8;
  
  // Buffers y matrices
  private coefficients: Float32Array[];
  private energyMap: Float32Array[];
  private phaseMap: Float32Array[];
  
  // Wavelets base
  private readonly motherWavelets: {[key: string]: (t: number, s: number) => number} = {
    morlet: (t: number, s: number) => this.morletWavelet(t, s),
    mexican_hat: (t: number, s: number) => this.mexicanHatWavelet(t, s),
    daubechies4: (t: number, s: number) => this.daubechiesWavelet(t, s, 4),
    symlet8: (t: number, s: number) => this.symletWavelet(t, s, 8)
  };

  // Análisis avanzado
  private readonly FEATURE_EXTRACTORS = new Map([
    ['heartRate', this.extractHeartRateFeatures.bind(this)],
    ['variability', this.extractVariabilityFeatures.bind(this)],
    ['respiratory', this.extractRespiratoryFeatures.bind(this)],
    ['artifacts', this.detectArtifacts.bind(this)]
  ]);

  constructor(config: WaveletConfig) {
    this.config = this.validateConfig(config);
    this.initializeBuffers();
    this.setupAnalysis();
  }

  /**
   * Analiza una señal usando transformada wavelet continua
   */
  public analyze(signal: Float32Array): WaveletDecomposition {
    try {
      // Preprocesamiento
      const normalizedSignal = this.normalizeSignal(signal);
      
      // Descomposición wavelet
      const decomposition = this.performDecomposition(normalizedSignal);
      
      // Análisis de características
      const features = this.extractFeatures(decomposition);
      
      // Detección de eventos
      const events = this.detectEvents(decomposition, features);
      
      // Post-procesamiento y validación
      const results = this.postProcessResults(decomposition, features, events);
      
      return this.validateResults(results);

    } catch (error) {
      console.error('Error en análisis wavelet:', error);
      return this.getEmptyDecomposition();
    }
  }

  /**
   * Descomposición wavelet optimizada
   */
  private performDecomposition(signal: Float32Array): WaveletDecomposition {
    const scales = this.generateScales();
    const decomposition: WaveletDecomposition = {
      coefficients: [],
      energies: [],
      phases: [],
      scales: scales
    };

    // Paralelizar cálculos por escalas
    scales.forEach((scale, idx) => {
      // Convolución optimizada
      const coeffs = this.computeWaveletTransform(signal, scale);
      
      // Análisis de energía
      const energy = this.computeEnergySpectrum(coeffs);
      
      // Análisis de fase
      const phase = this.computePhaseSpectrum(coeffs);
      
      decomposition.coefficients[idx] = coeffs;
      decomposition.energies[idx] = energy;
      decomposition.phases[idx] = phase;
    });

    return decomposition;
  }

  /**
   * Extracción de características espectrales
   */
  private extractFeatures(decomposition: WaveletDecomposition): SpectralFeatures {
    const features: SpectralFeatures = {
      heartRate: [],
      variability: [],
      respiratory: [],
      artifacts: []
    };

    // Extraer características en paralelo
    this.FEATURE_EXTRACTORS.forEach((extractor, featureType) => {
      features[featureType] = extractor(decomposition);
    });

    return features;
  }

  /**
   * Detección de eventos fisiológicos
   */
  private detectEvents(
    decomposition: WaveletDecomposition, 
    features: SpectralFeatures
  ): PhysiologicalEvents {
    return {
      heartbeats: this.detectHeartbeats(decomposition, features),
      artifacts: this.detectArtifacts(decomposition, features),
      respiratory: this.detectRespiratoryEvents(decomposition, features)
    };
  }

  /**
   * Wavelets madre optimizados
   */
  private morletWavelet(t: number, s: number): number {
    const omega0 = 6.0;
    const term1 = Math.exp(-t * t / (2 * s * s));
    const term2 = Math.cos(omega0 * t / s);
    const term3 = Math.exp(-omega0 * omega0 / 2);
    return (1 / Math.sqrt(s)) * (term1 * (term2 - term3));
  }

  private mexicanHatWavelet(t: number, s: number): number {
    const t2 = (t / s) * (t / s);
    return (1 / Math.sqrt(s)) * (1 - t2) * Math.exp(-t2 / 2);
  }

  /**
   * Análisis de variabilidad cardíaca
   */
  private analyzeHeartRateVariability(peaks: number[]): HRVMetrics {
    const intervals = this.calculateRRIntervals(peaks);
    return {
      sdnn: this.calculateSDNN(intervals),
      rmssd: this.calculateRMSSD(intervals),
      pnn50: this.calculatePNN50(intervals),
      triangularIndex: this.calculateTriangularIndex(intervals)
    };
  }

  /**
   * Detección de arritmias
   */
  private detectArrhythmias(
    decomposition: WaveletDecomposition, 
    hrv: HRVMetrics
  ): ArrhythmiaDetection {
    const patterns = this.analyzeRhythmPatterns(decomposition);
    const irregularities = this.detectIrregularities(patterns, hrv);
    
    return {
      detected: irregularities.length > 0,
      type: this.classifyArrhythmia(irregularities),
      confidence: this.calculateConfidence(irregularities),
      patterns: irregularities
    };
  }

  /**
   * Optimización de escalas
   */
  private optimizeScales(): number[] {
    const minScale = 2;
    const maxScale = this.config.windowSize / 4;
    const numScales = Math.ceil(Math.log2(maxScale / minScale));
    
    return Array.from({length: numScales}, (_, i) => {
      return minScale * Math.pow(2, i / this.config.scaleResolution);
    });
  }

  /**
   * Validación y control de calidad
   */
  private validateResults(results: WaveletDecomposition): WaveletDecomposition {
    if (!this.checkQuality(results)) {
      throw new Error('Resultados no válidos');
    }
    return results;
  }

  /**
   * Reset del analizador
   */
  public reset(): void {
    this.coefficients = [];
    this.energyMap = [];
    this.phaseMap = [];
    this.setupAnalysis();
  }

  /**
   * Obtener métricas de calidad
   */
  public getQualityMetrics(): QualityMetrics {
    return {
      signalQuality: this.calculateSignalQuality(),
      decompositionQuality: this.calculateDecompositionQuality(),
      featureReliability: this.calculateFeatureReliability()
    };
  }
}
