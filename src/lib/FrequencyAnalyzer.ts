import {
  FrequencyConfig, SpectralAnalysis, FrequencyBands,
  SpectralFeatures, FrequencyResponse, PowerSpectrum,
  SpectralDensity, HarmonicAnalysis, PhaseAnalysis,
  FrequencyMetrics, SpectralQuality, BandPower
} from '@/types';

/**
 * Analizador avanzado de frecuencias para PPG
 * Implementa técnicas de última generación en análisis espectral
 * @version 2.0.0
 */
export class FrequencyAnalyzer {
  // Configuración optimizada
  private readonly config: FrequencyConfig = {
    sampleRate: 30,           // Hz
    windowSize: 512,          // Muestras
    overlapSize: 256,         // Solapamiento
    
    // Configuración espectral
    spectral: {
      method: 'welch',        // Método de estimación
      window: 'hanning',      // Ventana
      nfft: 1024,            // Puntos FFT
      detrend: 'linear',     // Detrending
      averaging: 'median'     // Promediado
    },

    // Bandas de frecuencia (Hz)
    bands: {
      vlf: [0.0, 0.04],      // Muy baja frecuencia
      lf: [0.04, 0.15],      // Baja frecuencia
      hf: [0.15, 0.4],       // Alta frecuencia
      cardiac: [0.5, 4.0],   // Banda cardíaca
      noise: [4.0, 15.0]     // Ruido
    },

    // Análisis armónico
    harmonics: {
      maxOrder: 5,           // Máximo orden
      minAmplitude: 0.1,     // Amplitud mínima
      tolerance: 0.05,       // Tolerancia
      tracking: true         // Seguimiento
    },

    // Análisis de fase
    phase: {
      unwrapping: 'simple',  // Desenvoltura
      smoothing: 0.1,        // Suavizado
      coherence: true,       // Coherencia
      groupDelay: true       // Retardo de grupo
    },

    // Optimizaciones
    optimization: {
      vectorization: true,   // SIMD
      parallelization: true, // Multi-hilo
      precision: 'double',   // Precisión
      cacheSize: 10,        // Tamaño de cache
      adaptiveWindow: true   // Ventana adaptativa
    }
  };

  // Procesadores especializados
  private readonly fftProcessor: FFTProcessor;
  private readonly windowProcessor: WindowProcessor;
  private readonly harmonicAnalyzer: HarmonicAnalyzer;
  private readonly phaseAnalyzer: PhaseAnalyzer;

  // Buffers optimizados
  private readonly buffers = {
    time: new Float64Array(1024),
    freq: new Float64Array(513),
    power: new Float64Array(513),
    phase: new Float64Array(513),
    harmonics: new Float64Array(10),
    workspace: new Float64Array(2048)
  };

  // Estado del analizador
  private readonly state = {
    lastSpectrum: null as PowerSpectrum | null,
    harmonicHistory: [] as HarmonicAnalysis[],
    phaseHistory: [] as PhaseAnalysis[],
    qualityHistory: [] as number[],
    adaptiveWindow: {
      size: 512,
      overlap: 256,
      adaptation: 0.1
    }
  };

  constructor() {
    this.initializeAnalyzer();
  }

  /**
   * Análisis principal de frecuencia
   * Implementa pipeline completo de análisis espectral
   */
  public analyze(signal: Float64Array): SpectralAnalysis {
    try {
      // 1. Validación de señal
      if (!this.validateSignal(signal)) {
        throw new Error('Invalid signal for frequency analysis');
      }

      // 2. Pre-procesamiento
      const prepared = this.prepareSignal(signal);

      // 3. Estimación espectral
      const spectrum = this.estimateSpectrum(prepared);

      // 4. Análisis de bandas
      const bands = this.analyzeBands(spectrum);

      // 5. Análisis armónico
      const harmonics = this.analyzeHarmonics(spectrum);

      // 6. Análisis de fase
      const phase = this.analyzePhase(spectrum);

      // 7. Extracción de características
      const features = this.extractFeatures({
        spectrum,
        bands,
        harmonics,
        phase
      });

      // 8. Análisis de calidad
      const quality = this.analyzeQuality({
        spectrum,
        bands,
        harmonics
      });

      // 9. Actualización de estado
      this.updateState({
        spectrum,
        harmonics,
        phase,
        quality
      });

      return {
        spectrum,
        bands,
        harmonics,
        phase,
        features,
        quality
      };

    } catch (error) {
      console.error('Error in frequency analysis:', error);
      return this.handleAnalysisError(error);
    }
  }

  /**
   * Estimación espectral avanzada
   */
  private estimateSpectrum(signal: Float64Array): PowerSpectrum {
    // 1. Segmentación
    const segments = this.segmentSignal(
      signal,
      this.state.adaptiveWindow.size,
      this.state.adaptiveWindow.overlap
    );

    // 2. Ventaneo
    const windowed = segments.map(segment =>
      this.applyWindow(segment, this.config.spectral.window)
    );

    // 3. FFT
    const ffts = windowed.map(segment =>
      this.computeFFT(segment, this.config.spectral.nfft)
    );

    // 4. Promediado
    const averaged = this.averageSpectra(
      ffts,
      this.config.spectral.averaging
    );

    // 5. Normalización
    return this.normalizeSpectrum(averaged);
  }

  /**
   * Análisis de bandas de frecuencia
   */
  private analyzeBands(spectrum: PowerSpectrum): FrequencyBands {
    const bands: FrequencyBands = {};
    
    // Cálculo para cada banda
    for (const [name, [low, high]] of Object.entries(this.config.bands)) {
      bands[name] = this.calculateBandPower(
        spectrum,
        low,
        high
      );
    }

    // Métricas adicionales
    bands.ratios = this.calculateBandRatios(bands);
    bands.normalized = this.normalizeBandPowers(bands);
    bands.relative = this.calculateRelativePowers(bands);

    return bands;
  }

  /**
   * Análisis armónico avanzado
   */
  private analyzeHarmonics(spectrum: PowerSpectrum): HarmonicAnalysis {
    // 1. Detección de fundamental
    const fundamental = this.detectFundamental(spectrum);

    // 2. Búsqueda de armónicos
    const harmonics = this.findHarmonics(
      spectrum,
      fundamental,
      this.config.harmonics.maxOrder
    );

    // 3. Validación de armónicos
    const validated = this.validateHarmonics(
      harmonics,
      this.config.harmonics.minAmplitude
    );

    // 4. Seguimiento temporal
    if (this.config.harmonics.tracking) {
      this.trackHarmonics(validated);
    }

    // 5. Métricas armónicas
    return this.calculateHarmonicMetrics(validated);
  }

  /**
   * Análisis de fase avanzado
   */
  private analyzePhase(spectrum: PowerSpectrum): PhaseAnalysis {
    // 1. Extracción de fase
    const phase = this.extractPhase(spectrum);

    // 2. Desenvoltura de fase
    const unwrapped = this.unwrapPhase(
      phase,
      this.config.phase.unwrapping
    );

    // 3. Suavizado de fase
    const smoothed = this.smoothPhase(
      unwrapped,
      this.config.phase.smoothing
    );

    // 4. Análisis de coherencia
    const coherence = this.config.phase.coherence ?
      this.analyzeCoherence(smoothed) :
      null;

    // 5. Retardo de grupo
    const groupDelay = this.config.phase.groupDelay ?
      this.calculateGroupDelay(smoothed) :
      null;

    return {
      phase: smoothed,
      coherence,
      groupDelay,
      metrics: this.calculatePhaseMetrics({
        phase: smoothed,
        coherence,
        groupDelay
      })
    };
  }

  /**
   * Optimizaciones de bajo nivel
   */
  private computeFFT(
    signal: Float64Array,
    nfft: number
  ): ComplexArray {
    // 1. Preparación de datos
    const padded = new Float64Array(nfft);
    padded.set(signal);

    // 2. FFT in-place
    this.fftProcessor.transform(
      padded,
      this.buffers.workspace
    );

    // 3. Organización de resultados
    const complex = new ComplexArray(nfft / 2 + 1);
    for (let i = 0; i <= nfft / 2; i++) {
      complex.real[i] = padded[2 * i];
      complex.imag[i] = padded[2 * i + 1];
    }

    return complex;
  }

  /**
   * Gestión de estado
   */
  private updateState(data: {
    spectrum: PowerSpectrum;
    harmonics: HarmonicAnalysis;
    phase: PhaseAnalysis;
    quality: SpectralQuality;
  }): void {
    // 1. Actualización de espectro
    this.state.lastSpectrum = data.spectrum;

    // 2. Actualización de historiales
    this.state.harmonicHistory.push(data.harmonics);
    this.state.phaseHistory.push(data.phase);
    this.state.qualityHistory.push(data.quality.overall);

    // 3. Mantenimiento de historiales
    if (this.state.harmonicHistory.length > 30) {
      this.state.harmonicHistory.shift();
      this.state.phaseHistory.shift();
      this.state.qualityHistory.shift();
    }

    // 4. Adaptación de ventana
    this.updateAdaptiveWindow(data.quality);
  }

  /**
   * Gestión de recursos
   */
  public dispose(): void {
    try {
      // 1. Limpieza de procesadores
      this.fftProcessor.dispose();
      this.windowProcessor.dispose();
      this.harmonicAnalyzer.dispose();
      this.phaseAnalyzer.dispose();

      // 2. Limpieza de buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // 3. Limpieza de estado
      this.state.lastSpectrum = null;
      this.state.harmonicHistory = [];
      this.state.phaseHistory = [];
      this.state.qualityHistory = [];
      this.state.adaptiveWindow = {
        size: 512,
        overlap: 256,
        adaptation: 0.1
      };

    } catch (error) {
      console.error('Error in dispose:', error);
    }
  }
}
