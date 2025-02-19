import {
  HeartRateConfig, HeartRateData, PeakDetection,
  FrequencyAnalysis, QualityMetrics, ConfidenceLevel,
  BeatInterval, MonitorMode, ValidationResult,
  SignalQualityLevel, SpectralAnalysis
} from '@/types';

/**
 * Monitor avanzado de ritmo cardíaco
 * Optimizado para señales PPG sin flash y alta precisión
 * @version 2.0.0
 */
export class HeartRateMonitor {
  // Configuración del monitor
  private readonly config: HeartRateConfig = {
    minHR: 40,              // BPM mínimo
    maxHR: 200,             // BPM máximo
    windowSize: 256,        // Tamaño de ventana
    overlapSize: 128,       // Solapamiento
    samplingRate: 30,       // FPS de la cámara
    adaptiveMode: true,     // Modo adaptativo
    useKalman: true,        // Filtro Kalman
    confidenceThreshold: 0.7 // Umbral de confianza
  };

  // Estado del monitor
  private state = {
    lastReading: 0,
    lastConfidence: 0,
    beatHistory: [] as BeatInterval[],
    peakHistory: [] as number[],
    qualityHistory: [] as number[],
    frameCount: 0,
    mode: 'normal' as MonitorMode,
    isCalibrated: false,
    calibrationProgress: 0
  };

  // Filtro Kalman
  private kalman = {
    x: 0,  // Estado estimado
    p: 1,  // Covarianza del error
    q: 0.1, // Ruido del proceso
    r: 0.1  // Ruido de la medición
  };

  // Buffers optimizados
  private readonly buffers = {
    signal: new Float32Array(1024),
    peaks: new Float32Array(1024),
    intervals: new Float32Array(1024),
    spectrum: new Float32Array(1024)
  };

  // Sistema de eventos
  private readonly eventListeners = new Map<string, Function[]>();

  constructor(config?: Partial<HeartRateConfig>) {
    this.initialize(config);
  }

  /**
   * Procesamiento principal de señal PPG
   */
  public process(signal: number[]): HeartRateData {
    try {
      // 1. Validación inicial
      if (!this.validateSignal(signal)) {
        return this.getEmptyResult('Señal inválida');
      }

      // 2. Preparación de señal
      const prepared = this.prepareSignal(signal);

      // 3. Detección de picos
      const peaks = this.detectPeaks(prepared);

      // 4. Análisis de intervalos
      const intervals = this.analyzeIntervals(peaks);

      // 5. Análisis frecuencial
      const frequency = this.analyzeFrequency(prepared);

      // 6. Estimación de ritmo cardíaco
      const estimate = this.estimateHeartRate(intervals, frequency);

      // 7. Validación
      const validation = this.validateEstimate(estimate);

      // 8. Refinamiento
      const refined = this.refineEstimate(estimate, validation);

      // 9. Actualización de estado
      this.updateState(refined);

      // 10. Generación de resultado
      return this.generateResult(refined);

    } catch (error) {
      console.error('Error en procesamiento:', error);
      return this.handleProcessingError(error);
    }
  }

  /**
   * Detección avanzada de picos
   */
  private detectPeaks(signal: number[]): PeakDetection {
    // Detección inicial
    const peaks = this.findPeaks(signal);

    // Filtrado de picos
    const filtered = this.filterPeaks(peaks, signal);

    // Interpolación de picos perdidos
    const interpolated = this.interpolateMissingPeaks(filtered);

    // Validación de picos
    const validated = this.validatePeaks(interpolated);

    return {
      locations: validated.locations,
      amplitudes: validated.amplitudes,
      confidence: validated.confidence,
      intervals: this.calculatePeakIntervals(validated.locations)
    };
  }

  /**
   * Análisis de intervalos
   */
  private analyzeIntervals(peaks: PeakDetection): BeatInterval[] {
    const intervals: BeatInterval[] = [];

    for (let i = 1; i < peaks.locations.length; i++) {
      const interval = {
        duration: peaks.locations[i] - peaks.locations[i-1],
        amplitude: peaks.amplitudes[i],
        confidence: this.calculateIntervalConfidence(
          peaks.locations[i] - peaks.locations[i-1],
          peaks.amplitudes[i]
        )
      };

      if (this.isValidInterval(interval)) {
        intervals.push(interval);
      }
    }

    return this.filterOutlierIntervals(intervals);
  }

  /**
   * Análisis frecuencial
   */
  private analyzeFrequency(signal: number[]): FrequencyAnalysis {
    // FFT de la señal
    const spectrum = this.computeFFT(signal);

    // Análisis de bandas de frecuencia
    const bands = this.analyzeBands(spectrum);

    // Detección de frecuencia dominante
    const dominant = this.findDominantFrequency(bands);

    // Análisis de armónicos
    const harmonics = this.analyzeHarmonics(spectrum, dominant);

    return {
      dominant,
      harmonics,
      spectrum,
      bands,
      confidence: this.calculateSpectralConfidence(bands)
    };
  }

  /**
   * Estimación de ritmo cardíaco
   */
  private estimateHeartRate(
    intervals: BeatInterval[],
    frequency: FrequencyAnalysis
  ): HeartRateData {
    // Estimación por intervalos
    const intervalEstimate = this.estimateFromIntervals(intervals);

    // Estimación por frecuencia
    const frequencyEstimate = this.estimateFromFrequency(frequency);

    // Pesos adaptativos
    const weights = this.calculateWeights(
      intervalEstimate.confidence,
      frequencyEstimate.confidence
    );

    // Combinación ponderada
    return {
      bpm: weights.interval * intervalEstimate.bpm +
           weights.frequency * frequencyEstimate.bpm,
      confidence: Math.max(
        intervalEstimate.confidence,
        frequencyEstimate.confidence
      ),
      quality: this.calculateQuality(intervalEstimate, frequencyEstimate),
      intervals: intervals,
      peaks: frequency.spectrum
    };
  }

  /**
   * Validación de estimación
   */
  private validateEstimate(estimate: HeartRateData): ValidationResult {
    // Validación de rango
    const rangeValid = this.validateRange(estimate.bpm);

    // Validación de variación
    const variationValid = this.validateVariation(estimate.bpm);

    // Validación de confianza
    const confidenceValid = this.validateConfidence(estimate.confidence);

    // Validación de calidad
    const qualityValid = this.validateQuality(estimate.quality);

    return {
      isValid: rangeValid && variationValid && 
               confidenceValid && qualityValid,
      confidence: estimate.confidence,
      reasons: this.getValidationReasons({
        rangeValid,
        variationValid,
        confidenceValid,
        qualityValid
      })
    };
  }

  /**
   * Refinamiento de estimación
   */
  private refineEstimate(
    estimate: HeartRateData,
    validation: ValidationResult
  ): HeartRateData {
    if (!validation.isValid) {
      return this.getLastValidEstimate();
    }

    // Filtrado Kalman
    const filtered = this.applyKalmanFilter(estimate.bpm);

    // Suavizado temporal
    const smoothed = this.smoothEstimate(filtered);

    // Ajuste de confianza
    const confidence = this.adjustConfidence(
      estimate.confidence,
      validation.confidence
    );

    return {
      ...estimate,
      bpm: smoothed,
      confidence: confidence
    };
  }

  /**
   * Calibración del monitor
   */
  private calibrate(): void {
    if (this.state.isCalibrated) return;

    try {
      // Análisis de condiciones
      const conditions = this.analyzeConditions();

      // Ajuste de parámetros
      this.adjustParameters(conditions);

      // Actualización de estado
      this.updateCalibration(conditions);

    } catch (error) {
      console.error('Error en calibración:', error);
      this.handleCalibrationError(error);
    }
  }

  /**
   * Métodos de utilidad
   */
  private applyKalmanFilter(measurement: number): number {
    // Predicción
    const xPred = this.kalman.x;
    const pPred = this.kalman.p + this.kalman.q;

    // Actualización
    const k = pPred / (pPred + this.kalman.r);
    this.kalman.x = xPred + k * (measurement - xPred);
    this.kalman.p = (1 - k) * pPred;

    return this.kalman.x;
  }

  private validateSignal(signal: number[]): boolean {
    return signal && 
           signal.length >= this.config.windowSize &&
           !signal.some(isNaN);
  }

  private prepareSignal(signal: number[]): number[] {
    // Normalización
    const normalized = this.normalize(signal);

    // Filtrado inicial
    const filtered = this.preFilter(normalized);

    // Eliminación de tendencia
    return this.removeTrend(filtered);
  }

  /**
   * Métodos públicos adicionales
   */
  public start(): void {
    this.state.mode = 'normal';
    this.calibrate();
    this.emit('start');
  }

  public stop(): void {
    this.state.mode = 'idle';
    this.emit('stop');
  }

  public setConfig(config: Partial<HeartRateConfig>): void {
    Object.assign(this.config, config);
    this.reconfigure();
  }

  public getMetrics(): any {
    return {
      lastReading: this.state.lastReading,
      confidence: this.state.lastConfidence,
      quality: this.calculateAverageQuality(),
      mode: this.state.mode,
      isCalibrated: this.state.isCalibrated,
      frameCount: this.state.frameCount
    };
  }

  public on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(callback);
  }

  public off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Limpieza y disposición
   */
  public dispose(): void {
    try {
      // Detener monitoreo
      this.stop();

      // Limpiar eventos
      this.eventListeners.clear();

      // Limpiar buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // Resetear estado
      this.reset();

    } catch (error) {
      console.error('Error en dispose:', error);
    }
  }

  private reset(): void {
    this.state = {
      lastReading: 0,
      lastConfidence: 0,
      beatHistory: [],
      peakHistory: [],
      qualityHistory: [],
      frameCount: 0,
      mode: 'idle',
      isCalibrated: false,
      calibrationProgress: 0
    };
    this.resetKalman();
  }

  private emit(event: string, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => callback(data));
    }
  }
}
