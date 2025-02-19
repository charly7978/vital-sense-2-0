import {
  ProcessorConfig, SignalAnalysis, ProcessingPipeline,
  SignalValidation, ProcessingMetrics, AnalysisMode,
  ProcessingState, SignalFeatures, ProcessingQuality,
  SignalCalibration, ProcessorOptimization
} from '@/types';

// Importación de procesadores especializados
import { SignalFilter } from './SignalFilter';
import { SignalQualityAnalyzer } from './SignalQualityAnalyzer';
import { FrequencyAnalyzer } from './FrequencyAnalyzer';
import { WaveletAnalyzer } from './WaveletAnalyzer';
import { PulseAnalyzer } from './PulseAnalyzer';
import { MotionCompensator } from './MotionCompensator';
import { HeartRateEstimator } from './HeartRateEstimator';

/**
 * Procesador central de señales PPG
 * Coordina y optimiza todo el pipeline de procesamiento
 * @version 2.0.0
 */
export class SignalProcessor {
  // Configuración optimizada
  private readonly config: ProcessorConfig = {
    sampleRate: 30,           // Hz
    windowSize: 256,          // Muestras
    overlapSize: 128,         // Solapamiento
    processingMode: 'real_time', // Modo de procesamiento
    
    pipeline: {
      stages: [
        'filtering',          // Filtrado
        'quality',            // Calidad
        'motion',            // Compensación
        'frequency',         // Análisis frecuencial
        'wavelet',           // Análisis wavelet
        'pulse',             // Análisis de pulso
        'estimation'         // Estimación HR
      ],
      parallel: true,        // Procesamiento paralelo
      optimization: 'max'    // Nivel de optimización
    },

    validation: {
      minQuality: 0.7,       // Calidad mínima
      maxMotion: 0.3,        // Movimiento máximo
      minConfidence: 0.8,    // Confianza mínima
      stabilityThreshold: 0.85 // Estabilidad
    },

    calibration: {
      mode: 'adaptive',      // Calibración adaptativa
      interval: 30,          // Segundos
      reference: 'auto',     // Referencia automática
      adaptation: 0.1        // Tasa de adaptación
    },

    optimization: {
      vectorization: true,   // SIMD
      threading: true,       // Multi-hilo
      caching: true,        // Cache de resultados
      precision: 'high',    // Precisión alta
      memory: 'optimized'   // Gestión de memoria
    }
  };

  // Procesadores especializados
  private readonly filter: SignalFilter;
  private readonly qualityAnalyzer: SignalQualityAnalyzer;
  private readonly frequencyAnalyzer: FrequencyAnalyzer;
  private readonly waveletAnalyzer: WaveletAnalyzer;
  private readonly pulseAnalyzer: PulseAnalyzer;
  private readonly motionCompensator: MotionCompensator;
  private readonly heartRateEstimator: HeartRateEstimator;

  // Buffers optimizados
  private readonly buffers = {
    input: new Float64Array(1024),
    filtered: new Float64Array(1024),
    processed: new Float64Array(1024),
    features: new Float64Array(256),
    metrics: new Float64Array(128)
  };

  // Estado del procesador
  private readonly state: ProcessingState = {
    calibration: {
      isCalibrated: false,
      referenceValues: new Float64Array(30),
      calibrationTime: 0
    },
    processing: {
      lastValidResult: null,
      processingTime: 0,
      stageMetrics: new Map()
    },
    quality: {
      overall: 0,
      history: [],
      threshold: this.config.validation.minQuality
    },
    optimization: {
      cache: new Map(),
      performance: new Map(),
      resources: new Map()
    }
  };

  constructor() {
    this.initializeProcessor();
  }

  /**
   * Procesamiento principal de señal
   * Coordina todo el pipeline de análisis
   */
  public process(signal: Float64Array): SignalAnalysis {
    try {
      // 1. Validación inicial
      if (!this.validateInput(signal)) {
        throw new Error('Invalid input signal');
      }

      // 2. Preparación de procesamiento
      const prepared = this.prepareProcessing(signal);

      // 3. Ejecución del pipeline
      const result = this.executePipeline(prepared);

      // 4. Validación de resultados
      const validated = this.validateResults(result);

      // 5. Calibración si es necesario
      const calibrated = this.calibrateIfNeeded(validated);

      // 6. Optimización de recursos
      this.optimizeResources();

      // 7. Actualización de estado
      this.updateState(calibrated);

      return calibrated;

    } catch (error) {
      console.error('Error in signal processing:', error);
      return this.handleProcessingError(error);
    }
  }

  /**
   * Ejecución del pipeline de procesamiento
   */
  private executePipeline(signal: Float64Array): ProcessingPipeline {
    const startTime = performance.now();

    // 1. Filtrado de señal
    const filtered = this.filter.filter(signal);

    // 2. Análisis de calidad
    const quality = this.qualityAnalyzer.analyze(filtered);

    // 3. Compensación de movimiento
    const compensated = this.motionCompensator.compensate(filtered);

    // 4. Análisis de frecuencia
    const frequency = this.frequencyAnalyzer.analyze(compensated);

    // 5. Análisis wavelet
    const wavelet = this.waveletAnalyzer.analyze(compensated);

    // 6. Análisis de pulso
    const pulse = this.pulseAnalyzer.analyze(compensated);

    // 7. Estimación de ritmo cardíaco
    const heartRate = this.heartRateEstimator.estimate({
      filtered,
      frequency,
      wavelet,
      pulse
    });

    const endTime = performance.now();
    this.updateProcessingMetrics(endTime - startTime);

    return {
      filtered,
      quality,
      compensated,
      frequency,
      wavelet,
      pulse,
      heartRate
    };
  }

  /**
   * Validación de resultados
   */
  private validateResults(
    pipeline: ProcessingPipeline
  ): SignalValidation {
    // 1. Validación de calidad
    const qualityValid = this.validateQuality(
      pipeline.quality
    );

    // 2. Validación de movimiento
    const motionValid = this.validateMotion(
      pipeline.compensated
    );

    // 3. Validación de pulso
    const pulseValid = this.validatePulse(
      pipeline.pulse
    );

    // 4. Validación de estimación
    const estimationValid = this.validateEstimation(
      pipeline.heartRate
    );

    // 5. Validación global
    return this.validateOverall({
      qualityValid,
      motionValid,
      pulseValid,
      estimationValid
    });
  }

  /**
   * Calibración adaptativa
   */
  private calibrateIfNeeded(
    results: SignalValidation
  ): SignalCalibration {
    // 1. Verificación de necesidad
    if (!this.needsCalibration(results)) {
      return results;
    }

    // 2. Actualización de referencia
    this.updateCalibrationReference(results);

    // 3. Ajuste de parámetros
    this.adjustProcessingParameters(results);

    // 4. Recalibración de procesadores
    this.recalibrateProcessors();

    // 5. Validación de calibración
    return this.validateCalibration(results);
  }

  /**
   * Optimización de recursos
   */
  private optimizeResources(): void {
    // 1. Gestión de memoria
    this.optimizeMemory();

    // 2. Gestión de cache
    this.optimizeCache();

    // 3. Gestión de rendimiento
    this.optimizePerformance();

    // 4. Limpieza de recursos
    this.cleanupResources();
  }

  /**
   * Optimizaciones de bajo nivel
   */
  private optimizeMemory(): void {
    // 1. Compactación de buffers
    Object.values(this.buffers).forEach(buffer => {
      if (buffer.length > this.config.windowSize * 2) {
        const newBuffer = new Float64Array(this.config.windowSize);
        newBuffer.set(
          buffer.subarray(buffer.length - this.config.windowSize)
        );
        buffer = newBuffer;
      }
    });

    // 2. Limpieza de cache
    if (this.state.optimization.cache.size > 100) {
      const oldestKey = this.state.optimization.cache.keys().next().value;
      this.state.optimization.cache.delete(oldestKey);
    }

    // 3. Optimización de recursos
    this.state.optimization.resources.forEach((usage, resource) => {
      if (usage < 0.3) { // Bajo uso
        this.releaseResource(resource);
      }
    });
  }

  /**
   * Gestión de estado
   */
  private updateState(results: SignalCalibration): void {
    // 1. Actualización de calibración
    this.state.calibration.isCalibrated = results.isCalibrated;
    this.state.calibration.calibrationTime = Date.now();

    // 2. Actualización de procesamiento
    if (results.isValid) {
      this.state.processing.lastValidResult = results;
    }
    this.state.processing.processingTime = results.processingTime;

    // 3. Actualización de calidad
    this.state.quality.overall = results.quality.overall;
    this.state.quality.history.push(results.quality.overall);
    if (this.state.quality.history.length > 100) {
      this.state.quality.history.shift();
    }

    // 4. Actualización de optimización
    this.updateOptimizationMetrics(results);
  }

  /**
   * Gestión de recursos
   */
  public dispose(): void {
    try {
      // 1. Limpieza de procesadores
      this.filter.dispose();
      this.qualityAnalyzer.dispose();
      this.frequencyAnalyzer.dispose();
      this.waveletAnalyzer.dispose();
      this.pulseAnalyzer.dispose();
      this.motionCompensator.dispose();
      this.heartRateEstimator.dispose();

      // 2. Limpieza de buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // 3. Limpieza de estado
      this.state.calibration.referenceValues.fill(0);
      this.state.processing.stageMetrics.clear();
      this.state.optimization.cache.clear();
      this.state.optimization.performance.clear();
      this.state.optimization.resources.clear();

      // 4. Limpieza de memoria
      this.cleanupMemory();

    } catch (error) {
      console.error('Error in dispose:', error);
    }
  }
}
