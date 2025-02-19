import { 
  FilterConfig, FilterType, FilterResponse, 
  SignalQuality, FrequencyBand, FilterState,
  SpectralAnalysis, FilterCoefficients
} from '@/types';

/**
 * Filtro de señal avanzado optimizado para PPG sin flash
 * Implementa múltiples técnicas de filtrado adaptativo
 * @version 2.0.0
 */
export class SignalFilter {
  // Configuración del filtro
  private readonly config: FilterConfig = {
    sampleRate: 30,
    cutoffLow: 0.5,
    cutoffHigh: 4.0,
    filterOrder: 4,
    adaptiveMode: true,
    useKalman: true,
    useMorphological: true,
    windowSize: 256
  };

  // Estado del filtro
  private state: FilterState = {
    lastInput: new Float32Array(256),
    lastOutput: new Float32Array(256),
    coefficients: null,
    phase: 0,
    initialized: false
  };

  // Buffers y coeficientes
  private readonly buffers = {
    input: new Float32Array(1024),
    output: new Float32Array(1024),
    temp: new Float32Array(1024),
    fft: new Float32Array(1024)
  };

  // Filtros específicos
  private readonly filters = {
    kalman: this.initKalmanFilter(),
    butterworth: this.initButterworthFilter(),
    morphological: this.initMorphologicalFilter(),
    wavelet: this.initWaveletFilter(),
    median: this.initMedianFilter()
  };

  // Análisis espectral
  private spectralState = {
    lastSpectrum: new Float32Array(512),
    noiseProfile: new Float32Array(512),
    signalBands: new Map<FrequencyBand, number>()
  };

  constructor(config?: Partial<FilterConfig>) {
    this.initialize(config);
  }

  /**
   * Filtrado adaptativo principal
   */
  public filterAdaptive(signal: number[]): number[] {
    try {
      // 1. Preparación de señal
      const prepared = this.prepareSignal(signal);

      // 2. Análisis espectral
      const spectrum = this.analyzeSpectrum(prepared);

      // 3. Selección de filtros
      const filters = this.selectOptimalFilters(spectrum);

      // 4. Aplicación de filtros en cascada
      let filtered = prepared;
      for (const filter of filters) {
        filtered = this.applyFilter(filtered, filter);
      }

      // 5. Post-procesamiento
      const processed = this.postProcess(filtered);

      // 6. Actualización de estado
      this.updateState(processed, spectrum);

      return processed;

    } catch (error) {
      console.error('Error en filtrado adaptativo:', error);
      return signal; // Retorna señal original en caso de error
    }
  }

  /**
   * Preparación de señal
   */
  private prepareSignal(signal: number[]): number[] {
    // Validación
    if (!signal?.length) return [];

    // Conversión y normalización
    const normalized = this.normalize(signal);

    // Detección y corrección de outliers
    const cleaned = this.removeOutliers(normalized);

    // Interpolación de datos faltantes
    return this.interpolateMissing(cleaned);
  }

  /**
   * Análisis espectral avanzado
   */
  private analyzeSpectrum(signal: number[]): SpectralAnalysis {
    // FFT optimizada
    const fft = this.computeFFT(signal);

    // Análisis de bandas de frecuencia
    const bands = this.analyzeBands(fft);

    // Detección de ruido
    const noise = this.detectNoise(fft);

    // Características espectrales
    const features = this.extractSpectralFeatures(fft);

    return {
      fft,
      bands,
      noise,
      features,
      quality: this.assessSpectralQuality(features)
    };
  }

  /**
   * Filtro Kalman adaptativo
   */
  private kalmanFilter(signal: number[]): number[] {
    const filtered = new Float32Array(signal.length);
    let x = signal[0];
    let p = 1;
    const q = 0.1;  // Ruido de proceso
    const r = 0.1;  // Ruido de medición

    for (let i = 0; i < signal.length; i++) {
      // Predicción
      const xPred = x;
      const pPred = p + q;

      // Actualización
      const k = pPred / (pPred + r);
      x = xPred + k * (signal[i] - xPred);
      p = (1 - k) * pPred;

      filtered[i] = x;
    }

    return Array.from(filtered);
  }

  /**
   * Filtro Butterworth
   */
  private butterworthFilter(signal: number[], cutoff: number): number[] {
    const filtered = new Float32Array(signal.length);
    const order = this.config.filterOrder;
    const coeffs = this.calculateButterworthCoefficients(cutoff, order);

    // Aplicar filtro forward-backward
    this.applyButterworthForward(signal, filtered, coeffs);
    this.applyButterworthBackward(filtered, coeffs);

    return Array.from(filtered);
  }

  /**
   * Filtro morfológico
   */
  private morphologicalFilter(signal: number[]): number[] {
    // Operaciones morfológicas básicas
    const opened = this.morphologicalOpen(signal);
    const closed = this.morphologicalClose(opened);

    // Eliminación de baseline
    const baseline = this.estimateBaseline(closed);
    const corrected = this.removeBaseline(closed, baseline);

    return corrected;
  }

  /**
   * Filtro wavelet
   */
  private waveletFilter(signal: number[]): number[] {
    // Descomposición wavelet
    const coeffs = this.waveletDecomposition(signal);

    // Threshold adaptativo
    this.adaptiveThreshold(coeffs);

    // Reconstrucción
    return this.waveletReconstruction(coeffs);
  }

  /**
   * Filtro de mediana adaptativo
   */
  private adaptiveMedianFilter(signal: number[]): number[] {
    const filtered = new Float32Array(signal.length);
    let windowSize = 3;

    for (let i = 0; i < signal.length; i++) {
      // Ajuste adaptativo de ventana
      windowSize = this.adjustWindowSize(signal, i, windowSize);

      // Aplicar filtro de mediana
      filtered[i] = this.calculateMedian(signal, i, windowSize);
    }

    return Array.from(filtered);
  }

  /**
   * Post-procesamiento
   */
  private postProcess(signal: number[]): number[] {
    // Suavizado final
    const smoothed = this.smoothSignal(signal);

    // Corrección de fase
    const phaseCorrected = this.correctPhase(smoothed);

    // Normalización final
    return this.normalizeOutput(phaseCorrected);
  }

  /**
   * Métodos de utilidad
   */
  private normalize(signal: number[]): number[] {
    const min = Math.min(...signal);
    const max = Math.max(...signal);
    return signal.map(x => (x - min) / (max - min));
  }

  private removeOutliers(signal: number[]): number[] {
    const q1 = this.calculateQuantile(signal, 0.25);
    const q3 = this.calculateQuantile(signal, 0.75);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    return signal.map(x => x < lower || x > upper ? this.interpolateValue(signal, x) : x);
  }

  private interpolateMissing(signal: number[]): number[] {
    const result = [...signal];
    for (let i = 1; i < result.length - 1; i++) {
      if (!isFinite(result[i])) {
        result[i] = (result[i-1] + result[i+1]) / 2;
      }
    }
    return result;
  }

  /**
   * Métodos públicos adicionales
   */
  public setConfig(config: Partial<FilterConfig>): void {
    Object.assign(this.config, config);
    this.reconfigureFilters();
  }

  public reset(): void {
    this.state = {
      lastInput: new Float32Array(256),
      lastOutput: new Float32Array(256),
      coefficients: null,
      phase: 0,
      initialized: false
    };
    this.initializeBuffers();
  }

  public getResponse(): FilterResponse {
    return {
      magnitude: this.calculateMagnitudeResponse(),
      phase: this.calculatePhaseResponse(),
      groupDelay: this.calculateGroupDelay()
    };
  }

  /**
   * Limpieza de recursos
   */
  public dispose(): void {
    try {
      // Limpiar buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // Resetear estado
      this.reset();

      // Limpiar filtros
      Object.values(this.filters).forEach(filter => {
        if (filter?.dispose) filter.dispose();
      });

    } catch (error) {
      console.error('Error en dispose:', error);
    }
  }
}
