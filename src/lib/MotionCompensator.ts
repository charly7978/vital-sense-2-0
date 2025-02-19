import {
  MotionConfig, MotionVector, StabilizationResult,
  FrameQuality, MotionMetrics, CompensationMode,
  OpticalFlow, FeatureTracking, MotionPrediction,
  StabilizationMatrix, ImageAlignment
} from '@/types';

/**
 * Compensador de movimiento avanzado
 * Implementa técnicas de última generación para estabilización
 * @version 2.0.0
 */
export class MotionCompensator {
  // Configuración optimizada
  private readonly config: MotionConfig = {
    blockSize: 16,          // Tamaño de bloque para tracking
    searchRange: 32,        // Rango de búsqueda
    minFeatures: 50,        // Mínimo de features
    maxFeatures: 200,       // Máximo de features
    qualityLevel: 0.01,     // Nivel de calidad
    minDistance: 10,        // Distancia mínima entre features
    
    // Configuración de tracking
    tracking: {
      winSize: [21, 21],    // Ventana de tracking
      maxLevel: 3,          // Niveles piramidales
      maxIter: 30,          // Iteraciones máximas
      epsilon: 0.01,        // Criterio de terminación
      minEigThreshold: 1e-4 // Umbral eigen mínimo
    },

    // Configuración de estabilización
    stabilization: {
      smoothingWindow: 30,  // Frames
      borderMode: 'reflect',// Modo de borde
      cropMargin: 0.1,     // Margen de recorte
      interpolation: 'cubic'// Método de interpolación
    },

    // Umbrales de movimiento
    thresholds: {
      displacement: 20,     // Píxeles
      rotation: 15,        // Grados
      scale: 0.2,         // Factor de escala
      confidence: 0.8     // Confianza mínima
    }
  };

  // Procesadores especializados
  private readonly opticalFlow: OpticalFlow;
  private readonly featureTracker: FeatureTracking;
  private readonly motionPredictor: MotionPrediction;
  private readonly imageAligner: ImageAlignment;

  // Buffers optimizados
  private readonly buffers = {
    features: new Float32Array(400 * 2),  // 200 features x 2 coords
    flow: new Float32Array(400 * 2),      // 200 vectors x 2 components
    transform: new Float32Array(9),        // 3x3 transformation matrix
    prediction: new Float32Array(6),       // Affine transform params
    errors: new Float32Array(200),        // Per-feature errors
    weights: new Float32Array(200)        // Feature weights
  };

  // Estado del compensador
  private state = {
    lastFeatures: [] as number[][],
    lastTransform: new Float32Array(9),
    motionHistory: [] as MotionVector[],
    qualityHistory: [] as number[],
    referenceFrame: null as ImageData | null
  };

  constructor() {
    this.initializeCompensator();
  }

  /**
   * Compensación principal de movimiento
   * Implementa pipeline completo de estabilización
   */
  public compensate(frame: ImageData): StabilizationResult {
    try {
      // 1. Validación de frame
      if (!this.validateFrame(frame)) {
        throw new Error('Invalid frame for motion compensation');
      }

      // 2. Detección de features
      const features = this.detectFeatures(frame);

      // 3. Tracking de movimiento
      const tracked = this.trackFeatures(
        features,
        this.state.lastFeatures
      );

      // 4. Estimación de movimiento
      const motion = this.estimateMotion(
        tracked.current,
        tracked.previous
      );

      // 5. Predicción de movimiento
      const prediction = this.predictMotion(motion);

      // 6. Estabilización
      const stabilized = this.stabilizeFrame(
        frame,
        motion,
        prediction
      );

      // 7. Evaluación de calidad
      const quality = this.evaluateQuality(
        stabilized,
        motion
      );

      // 8. Actualización de estado
      this.updateState(
        features,
        motion,
        quality
      );

      return {
        frame: stabilized,
        motion,
        quality,
        features: tracked
      };

    } catch (error) {
      console.error('Error in motion compensation:', error);
      return this.handleCompensationError(error);
    }
  }

  /**
   * Detección avanzada de features
   */
  private detectFeatures(frame: ImageData): number[][] {
    // 1. Preparación de imagen
    const prepared = this.prepareForDetection(frame);

    // 2. Detección de corners
    const corners = this.detectCorners(prepared);

    // 3. Filtrado de features
    const filtered = this.filterFeatures(
      corners,
      this.config.minDistance
    );

    // 4. Refinamiento sub-pixel
    const refined = this.refineFeatures(
      filtered,
      prepared
    );

    // 5. Selección de mejores features
    return this.selectBestFeatures(
      refined,
      this.config.maxFeatures
    );
  }

  /**
   * Tracking robusto de features
   */
  private trackFeatures(
    current: number[][],
    previous: number[][]
  ): {
    current: number[][];
    previous: number[][];
    status: boolean[];
    errors: Float32Array;
  } {
    // 1. Inicialización de tracking
    const status = new Array(current.length).fill(false);
    const errors = new Float32Array(current.length);

    // 2. Tracking piramidal
    for (let level = this.config.tracking.maxLevel; level >= 0; level--) {
      // 2.1 Tracking en nivel actual
      const tracked = this.trackFeaturesAtLevel(
        current,
        previous,
        level
      );

      // 2.2 Actualización de estados
      tracked.forEach((track, i) => {
        if (track.success) {
          status[i] = true;
          errors[i] = track.error;
          current[i] = track.position;
        }
      });
    }

    // 3. Filtrado de outliers
    const valid = this.filterOutliers(
      current,
      previous,
      status,
      errors
    );

    return {
      current: valid.current,
      previous: valid.previous,
      status: valid.status,
      errors
    };
  }

  /**
   * Estimación robusta de movimiento
   */
  private estimateMotion(
    current: number[][],
    previous: number[][]
  ): MotionVector {
    // 1. Estimación inicial
    const initial = this.estimateAffineTransform(
      current,
      previous
    );

    // 2. Refinamiento robusto
    const refined = this.refineTransformRANSAC(
      initial,
      current,
      previous
    );

    // 3. Descomposición de movimiento
    const components = this.decomposeTransform(refined);

    // 4. Validación de movimiento
    const validated = this.validateMotion(components);

    return {
      transform: refined,
      translation: validated.translation,
      rotation: validated.rotation,
      scale: validated.scale,
      confidence: validated.confidence
    };
  }

  /**
   * Predicción de movimiento
   */
  private predictMotion(current: MotionVector): MotionVector {
    // 1. Análisis de historia
    const history = this.analyzeMotionHistory();

    // 2. Predicción de tendencia
    const trend = this.predictTrend(history);

    // 3. Predicción Kalman
    const kalman = this.predictKalman(
      current,
      trend
    );

    // 4. Fusión de predicciones
    return this.fusePredictions(
      current,
      trend,
      kalman
    );
  }

  /**
   * Estabilización de frame
   */
  private stabilizeFrame(
    frame: ImageData,
    motion: MotionVector,
    prediction: MotionVector
  ): ImageData {
    // 1. Cálculo de transformación
    const transform = this.calculateStabilizationTransform(
      motion,
      prediction
    );

    // 2. Suavizado de movimiento
    const smoothed = this.smoothTransform(transform);

    // 3. Aplicación de transformación
    const warped = this.warpFrame(
      frame,
      smoothed
    );

    // 4. Ajuste de bordes
    const cropped = this.cropBorders(warped);

    return cropped;
  }

  /**
   * Evaluación de calidad
   */
  private evaluateQuality(
    stabilized: ImageData,
    motion: MotionVector
  ): FrameQuality {
    // 1. Calidad de tracking
    const trackingQuality = this.evaluateTrackingQuality();

    // 2. Calidad de movimiento
    const motionQuality = this.evaluateMotionQuality(motion);

    // 3. Calidad de estabilización
    const stabilityQuality = this.evaluateStabilityQuality(
      stabilized
    );

    // 4. Calidad global
    return this.calculateOverallQuality([
      trackingQuality,
      motionQuality,
      stabilityQuality
    ]);
  }

  /**
   * Optimizaciones de bajo nivel
   */
  private trackFeaturesAtLevel(
    current: number[][],
    previous: number[][],
    level: number
  ): {
    position: number[];
    success: boolean;
    error: number;
  }[] {
    return this.opticalFlow.track(
      current,
      previous,
      {
        ...this.config.tracking,
        pyramidLevel: level
      }
    );
  }

  private estimateAffineTransform(
    current: number[][],
    previous: number[][]
  ): Float32Array {
    return this.imageAligner.estimateTransform(
      current,
      previous,
      'affine'
    );
  }

  private warpFrame(
    frame: ImageData,
    transform: Float32Array
  ): ImageData {
    return this.imageAligner.warpImage(
      frame,
      transform,
      this.config.stabilization.interpolation
    );
  }

  /**
   * Gestión de estado
   */
  private updateState(
    features: number[][],
    motion: MotionVector,
    quality: FrameQuality
  ): void {
    // 1. Actualización de features
    this.state.lastFeatures = features;

    // 2. Actualización de transformación
    this.state.lastTransform = motion.transform;

    // 3. Actualización de historiales
    this.state.motionHistory.push(motion);
    this.state.qualityHistory.push(quality.overall);

    // 4. Mantener longitud máxima
    if (this.state.motionHistory.length > 
        this.config.stabilization.smoothingWindow) {
      this.state.motionHistory.shift();
      this.state.qualityHistory.shift();
    }
  }

  /**
   * Gestión de recursos
   */
  public dispose(): void {
    try {
      // 1. Limpieza de procesadores
      this.opticalFlow.dispose();
      this.featureTracker.dispose();
      this.motionPredictor.dispose();
      this.imageAligner.dispose();

      // 2. Limpieza de buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // 3. Limpieza de estado
      this.state = {
        lastFeatures: [],
        lastTransform: new Float32Array(9),
        motionHistory: [],
        qualityHistory: [],
        referenceFrame: null
      };

    } catch (error) {
      console.error('Error in dispose:', error);
    }
  }
}
