import { 
  PPGData, ProcessingMode, SensitivitySettings, 
  FingerDetection, DeviceInfo, CalibrationState,
  ProcessorEvent, VitalReading, SignalQualityLevel,
  WaveletFeatures, SpectralAnalysis, CalibrationPhase,
  ProcessingConfig, ProcessingState, QualityParams,
  ProcessorMetrics, CircularBuffer
} from '@/types';

import { SignalFilter } from './SignalFilter';
import { FingerDetector } from './FingerDetector';
import { WaveletAnalyzer } from './WaveletAnalyzer';
import { HeartRateEstimator } from './HeartRateEstimator';
import { MovementCompensator } from './MovementCompensator';
import { MLProcessor } from './MLProcessor';
import { BeepPlayer } from './BeepPlayer';

/**
 * Procesador PPG avanzado optimizado para cámaras traseras sin flash
 * Implementa las últimas técnicas en procesamiento de señales y ML
 * @version 2.0.0
 * @optimizedFor Cámaras traseras sin flash
 */
export class PPGProcessor {
  // Configuración principal
  private readonly config: ProcessingConfig = {
    sampleRate: 30,           // fps esperados
    bufferSize: 512,         // tamaño del buffer circular
    windowSize: 256,         // ventana de análisis
    minQuality: 0.6,         // calidad mínima aceptable
    adaptiveThreshold: true, // umbrales adaptativos
    useML: true,            // uso de machine learning
    debugMode: false        // modo debug
  };

  // Componentes del sistema
  private readonly signalFilter: SignalFilter;
  private readonly fingerDetector: FingerDetector;
  private readonly waveletAnalyzer: WaveletAnalyzer;
  private readonly hrEstimator: HeartRateEstimator;
  private readonly movementCompensator: MovementCompensator;
  private readonly mlProcessor: MLProcessor;
  private readonly beepPlayer: BeepPlayer;

  // Buffers circulares optimizados
  private readonly signalBuffer: CircularBuffer<number>;
  private readonly timeBuffer: CircularBuffer<number>;
  private readonly qualityBuffer: CircularBuffer<number>;
  private readonly heartRateBuffer: CircularBuffer<number>;

  // Estado del procesador
  private processingState: ProcessingState = {
    isProcessing: false,
    calibrationPhase: 'initial',
    lastProcessingTime: 0,
    frameCount: 0,
    validFrames: 0,
    errorCount: 0,
    startTime: 0,
    lastHeartRate: 0,
    stability: 0,
    confidence: 0
  };

  // Métricas y análisis
  private metrics = {
    signalQuality: 0,
    signalToNoise: 0,
    movementIndex: 0,
    perfusionIndex: 0,
    confidence: 0,
    stability: 0,
    coverage: 0
  };

  // Sistema de eventos
  private eventListeners: Map<ProcessorEvent, Function[]> = new Map();
  private readonly eventQueue: ProcessorEvent[] = [];

  // Constantes y umbrales
  private static readonly CONSTANTS = {
    MIN_FRAMES_FOR_CALIBRATION: 30,
    MAX_HEART_RATE: 200,
    MIN_HEART_RATE: 40,
    MAX_MOVEMENT: 0.3,
    MIN_SIGNAL_STRENGTH: 0.4,
    QUALITY_THRESHOLD: 0.6,
    STABILITY_WINDOW: 5
  };

  constructor(config?: Partial<ProcessingConfig>) {
    try {
      // Inicialización de componentes
      this.initializeComponents(config);
      this.initializeBuffers();
      this.setupEventSystem();
      this.validateSystem();
    } catch (error) {
      this.handleInitializationError(error);
    }
  }

  /**
   * Procesa un nuevo frame de video
   * @param frame Frame de la cámara
   * @returns Datos procesados de PPG
   */
  public processFrame(frame: ImageData): PPGData {
    try {
      // Validación inicial
      if (!this.validateFrame(frame)) {
        return this.getEmptyResult('Frame inválido');
      }

      // Medición de tiempo
      const startTime = performance.now();
      this.processingState.frameCount++;

      // 1. Detección de dedo
      const fingerDetection = this.detectFinger(frame);
      if (!fingerDetection.isPresent) {
        return this.getEmptyResult('Dedo no detectado');
      }

      // 2. Extracción de señal
      const signal = this.extractSignal(frame, fingerDetection);
      if (!this.validateSignal(signal)) {
        return this.getEmptyResult('Señal inválida');
      }

      // 3. Procesamiento de señal
      const processedSignal = this.processSignal(signal);
      
      // 4. Análisis wavelet
      const waveletFeatures = this.analyzeSignal(processedSignal);

      // 5. Estimación de ritmo cardíaco
      const heartRate = this.estimateHeartRate(waveletFeatures);

      // 6. Análisis de calidad
      const quality = this.assessQuality({
        signal: processedSignal,
        features: waveletFeatures,
        fingerDetection,
        heartRate
      });

      // 7. Actualización de estado
      this.updateState({
        signal,
        processedSignal,
        features: waveletFeatures,
        quality,
        heartRate
      });

      // 8. Generación de resultado
      const result = this.generateResult({
        heartRate,
        quality,
        confidence: this.metrics.confidence,
        processingTime: performance.now() - startTime
      });

      // 9. Notificación de eventos
      this.notifyUpdate(result);

      return result;

    } catch (error) {
      return this.handleProcessingError(error);
    }
  }

  /**
   * Detección avanzada de dedo con compensación ambiental
   */
  private detectFinger(frame: ImageData): FingerDetection {
    try {
      // Análisis de condiciones ambientales
      const conditions = this.analyzeAmbientConditions(frame);
      
      // Ajuste de parámetros según ambiente
      this.adjustDetectionParameters(conditions);
      
      // Detección de dedo
      const detection = this.fingerDetector.detect(frame);
      
      // Validación y mejora de detección
      return this.enhanceDetection(detection, conditions);
      
    } catch (error) {
      console.error('Error en detección:', error);
      return this.getEmptyDetection();
    }
  }

  /**
   * Extracción optimizada de señal PPG
   */
  private extractSignal(frame: ImageData, detection: FingerDetection): number[] {
    const roi = detection.roi;
    const signal: number[] = [];

    try {
      // Análisis de canales RGB
      const channels = this.extractColorChannels(frame, roi);
      
      // Cálculo de ratio de perfusión
      const perfusion = this.calculatePerfusionRatio(channels);
      
      // Normalización y filtrado inicial
      const normalizedSignal = this.normalizeSignal(perfusion);
      
      // Compensación de movimiento
      const compensatedSignal = this.movementCompensator.compensate(normalizedSignal);
      
      return compensatedSignal;

    } catch (error) {
      console.error('Error en extracción de señal:', error);
      return [];
    }
  }

  /**
   * Procesamiento avanzado de señal
   */
  private processSignal(signal: number[]): number[] {
    try {
      // 1. Filtrado adaptativo
      let processed = this.signalFilter.filterAdaptive(signal);

      // 2. Eliminación de tendencia
      processed = this.removeTrend(processed);

      // 3. Detección y eliminación de artefactos
      processed = this.removeArtifacts(processed);

      // 4. Análisis espectral
      const spectral = this.performSpectralAnalysis(processed);

      // 5. Mejora de señal basada en espectro
      processed = this.enhanceSignal(processed, spectral);

      // 6. Normalización final
      return this.normalizeProcessedSignal(processed);

    } catch (error) {
      console.error('Error en procesamiento:', error);
      return signal;
    }
  }

  /**
   * Análisis wavelet multi-resolución
   */
  private analyzeSignal(signal: number[]): WaveletFeatures {
    try {
      // Análisis wavelet
      const wavelet = this.waveletAnalyzer.analyze(signal);

      // Extracción de características
      const features = this.extractWaveletFeatures(wavelet);

      // Análisis de componentes
      const components = this.analyzeComponents(features);

      // Detección de patrones
      const patterns = this.detectPatterns(components);

      return {
        features,
        components,
        patterns,
        quality: this.assessWaveletQuality(features)
      };

    } catch (error) {
      console.error('Error en análisis wavelet:', error);
      return this.getEmptyWaveletFeatures();
    }
  }

  /**
   * Estimación avanzada de ritmo cardíaco
   */
  private estimateHeartRate(features: WaveletFeatures): number {
    try {
      // Estimación inicial
      const initial = this.hrEstimator.estimate(features);

      // Validación con histórico
      const validated = this.validateHeartRate(initial);

      // Refinamiento con ML
      const refined = this.refineWithML(validated);

      // Actualización de confianza
      this.updateConfidence(refined);

      return refined;

    } catch (error) {
      console.error('Error en estimación:', error);
      return 0;
    }
  }

  /**
   * Sistema de calibración multi-fase
   */
  private calibrate(): void {
    try {
      switch (this.processingState.calibrationPhase) {
        case 'initial':
          this.performInitialCalibration();
          break;
        case 'ambient':
          this.calibrateAmbientLight();
          break;
        case 'signal':
          this.calibrateSignalLevels();
          break;
        case 'final':
          this.finalizeCalibracion();
          break;
      }
    } catch (error) {
      this.handleCalibrationError(error);
    }
  }

  /**
   * Análisis de calidad multi-métrica
   */
  private assessQuality(params: QualityParams): SignalQualityLevel {
    const metrics = {
      signalStrength: this.calculateSignalStrength(params.signal),
      signalToNoise: this.calculateSNR(params.signal),
      movement: this.calculateMovementIndex(params.features),
      perfusion: this.calculatePerfusionIndex(params.signal),
      stability: this.calculateStability(params.heartRate)
    };

    // Pesos adaptativos
    const weights = this.calculateAdaptiveWeights(metrics);

    // Cálculo de calidad general
    const overallQuality = this.calculateOverallQuality(metrics, weights);

    return this.determineQualityLevel(overallQuality);
  }

  /**
   * Sistema de eventos y notificaciones
   */
  private notifyUpdate(data: PPGData): void {
    try {
      // Notificar actualización
      this.eventListeners.get('update')?.forEach(callback => callback(data));

      // Procesar eventos en cola
      while (this.eventQueue.length > 0) {
        const event = this.eventQueue.shift();
        this.processEvent(event);
      }

    } catch (error) {
      console.error('Error en notificación:', error);
    }
  }

  /**
   * Manejo avanzado de errores
   */
  private handleProcessingError(error: any): PPGData {
    // Incrementar contador de errores
    this.processingState.errorCount++;

    // Logging detallado
    console.error('Error en procesamiento:', {
      error,
      state: this.processingState,
      metrics: this.metrics
    });

    // Recuperación si es posible
    if (this.canRecover()) {
      return this.attemptRecovery();
    }

    // Resultado vacío en caso de error no recuperable
    return this.getEmptyResult('Error en procesamiento');
  }

  /**
   * Optimizaciones de rendimiento
   */
  private optimizePerformance(): void {
    // Limpiar buffers antiguos
    this.cleanBuffers();

    // Optimizar uso de memoria
    this.optimizeMemoryUsage();

    // Ajustar parámetros según rendimiento
    this.adjustProcessingParameters();
  }

  /**
   * Métodos públicos adicionales
   */
  public start(): void {
    this.processingState.isProcessing = true;
    this.processingState.startTime = Date.now();
    this.calibrate();
  }

  public stop(): void {
    this.processingState.isProcessing = false;
    this.cleanupResources();
  }

  public getMetrics(): ProcessorMetrics {
    return {
      ...this.metrics,
      processingTime: performance.now() - this.processingState.lastProcessingTime,
      frameRate: this.calculateFrameRate(),
      errorRate: this.calculateErrorRate()
    };
  }

  public setConfig(config: Partial<ProcessingConfig>): void {
    Object.assign(this.config, config);
    this.reconfigure();
  }

  /**
   * Limpieza y disposición
   */
  public dispose(): void {
    try {
      // Detener procesamiento
      this.stop();

      // Limpiar eventos
      this.eventListeners.clear();

      // Liberar recursos
      this.cleanupResources();

      // Resetear estado
      this.resetState();

    } catch (error) {
      console.error('Error en dispose:', error);
    }
  }

  // Métodos auxiliares privados
  private validateFrame(frame: ImageData): boolean {
    return frame && frame.data && frame.width > 0 && frame.height > 0;
  }

  private validateSignal(signal: number[]): boolean {
    return signal && signal.length > 0 && !signal.some(isNaN);
  }

  private canRecover(): boolean {
    return this.processingState.errorCount < 3;
  }

  private attemptRecovery(): PPGData {
    this.resetState();
    return this.getEmptyResult('Recuperando...');
  }

  private calculateFrameRate(): number {
    const elapsed = (Date.now() - this.processingState.startTime) / 1000;
    return this.processingState.frameCount / elapsed;
  }

  private calculateErrorRate(): number {
    return this.processingState.errorCount / this.processingState.frameCount;
  }

  private resetState(): void {
    this.processingState = {
      isProcessing: false,
      calibrationPhase: 'initial',
      lastProcessingTime: 0,
      frameCount: 0,
      validFrames: 0,
      errorCount: 0,
      startTime: 0,
      lastHeartRate: 0,
      stability: 0,
      confidence: 0
    };
  }
}
