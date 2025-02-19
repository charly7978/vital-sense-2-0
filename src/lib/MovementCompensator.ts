import {
  MovementConfig, MotionVector, CompensationResult,
  ROI, FrameData, StabilityMetrics, CompensationMode,
  MotionEstimate, QualityLevel
} from '@/types';

/**
 * Compensador de movimiento avanzado
 * Optimizado para estabilizar señales PPG durante movimiento
 * @version 2.0.0
 */
export class MovementCompensator {
  // Configuración del compensador
  private readonly config: MovementConfig = {
    blockSize: 16,          // Tamaño de bloque para análisis
    searchRadius: 24,       // Radio de búsqueda para tracking
    minQuality: 0.6,        // Calidad mínima aceptable
    maxMotion: 30,          // Movimiento máximo permitido (píxeles)
    stabilityThreshold: 0.8, // Umbral de estabilidad
    useKalman: true,        // Usar filtro Kalman
    adaptiveMode: true      // Modo adaptativo
  };

  // Estado del compensador
  private state = {
    lastFrame: null as FrameData | null,
    motionHistory: [] as MotionVector[],
    stabilityScore: 1,
    frameCount: 0,
    mode: 'normal' as CompensationMode,
    isCalibrated: false
  };

  // Filtros Kalman para X e Y
  private kalmanX = {
    x: 0, p: 1, q: 0.1, r: 0.1
  };

  private kalmanY = {
    x: 0, p: 1, q: 0.1, r: 0.1
  };

  // Buffers optimizados
  private readonly buffers = {
    motionVectors: new Array<MotionVector>(30),
    blockPatterns: new Float32Array(256),
    correlationMap: new Float32Array(2304), // 48x48
    stabilized: new Float32Array(1024)
  };

  constructor(config?: Partial<MovementConfig>) {
    this.initialize(config);
  }

  /**
   * Compensación principal de movimiento
   */
  public compensate(frame: FrameData, roi: ROI): CompensationResult {
    try {
      // 1. Validación inicial
      if (!this.validateFrame(frame)) {
        return this.getEmptyResult('Frame inválido');
      }

      // 2. Estimación de movimiento
      const motion = this.estimateMotion(frame, roi);

      // 3. Análisis de estabilidad
      const stability = this.analyzeStability(motion);

      // 4. Compensación de movimiento
      const compensated = this.applyCompensation(frame, motion);

      // 5. Validación de resultado
      const validation = this.validateCompensation(compensated);

      // 6. Refinamiento
      const refined = this.refineResult(compensated, validation);

      // 7. Actualización de estado
      this.updateState(refined, motion);

      return refined;

    } catch (error) {
      console.error('Error en compensación:', error);
      return this.handleCompensationError(error);
    }
  }

  /**
   * Estimación de movimiento
   */
  private estimateMotion(frame: FrameData, roi: ROI): MotionEstimate {
    // 1. División en bloques
    const blocks = this.divideIntoBlocks(frame, roi);

    // 2. Búsqueda de correspondencias
    const matches = this.findBlockMatches(blocks);

    // 3. Filtrado de matches
    const filtered = this.filterMatches(matches);

    // 4. Estimación de vectores
    const vectors = this.estimateVectors(filtered);

    // 5. Refinamiento de movimiento
    return this.refineMotion(vectors);
  }

  /**
   * Análisis de estabilidad
   */
  private analyzeStability(motion: MotionEstimate): StabilityMetrics {
    // Análisis de magnitud
    const magnitude = this.analyzeMagnitude(motion);

    // Análisis de dirección
    const direction = this.analyzeDirection(motion);

    // Análisis temporal
    const temporal = this.analyzeTemporalStability(motion);

    // Análisis espacial
    const spatial = this.analyzeSpatialCoherence(motion);

    return {
      magnitude,
      direction,
      temporal,
      spatial,
      overall: this.calculateOverallStability({
        magnitude,
        direction,
        temporal,
        spatial
      })
    };
  }

  /**
   * Compensación de movimiento
   */
  private applyCompensation(
    frame: FrameData,
    motion: MotionEstimate
  ): CompensationResult {
    // Compensación global
    const globalCompensated = this.compensateGlobalMotion(frame, motion);

    // Compensación local
    const localCompensated = this.compensateLocalMotion(globalCompensated, motion);

    // Estabilización temporal
    const stabilized = this.stabilizeTemporally(localCompensated);

    // Corrección de bordes
    const corrected = this.correctBoundaries(stabilized);

    return {
      frame: corrected,
      motion: motion,
      quality: this.assessQuality(corrected, motion)
    };
  }

  /**
   * Compensación de movimiento global
   */
  private compensateGlobalMotion(
    frame: FrameData,
    motion: MotionEstimate
  ): FrameData {
    // Aplicar filtro Kalman
    const filteredMotion = this.filterMotion(motion);

    // Transformación afín
    const transform = this.calculateAffineTransform(filteredMotion);

    // Aplicar transformación
    return this.applyTransform(frame, transform);
  }

  /**
   * Compensación de movimiento local
   */
  private compensateLocalMotion(
    frame: FrameData,
    motion: MotionEstimate
  ): FrameData {
    // División en regiones
    const regions = this.divideIntoRegions(frame);

    // Compensación por región
    const compensated = regions.map(region =>
      this.compensateRegion(region, motion)
    );

    // Fusión de regiones
    return this.mergeRegions(compensated);
  }

  /**
   * Filtrado de movimiento con Kalman
   */
  private filterMotion(motion: MotionVector): MotionVector {
    // Filtrado en X
    const filteredX = this.applyKalmanFilter(
      motion.dx,
      this.kalmanX
    );

    // Filtrado en Y
    const filteredY = this.applyKalmanFilter(
      motion.dy,
      this.kalmanY
    );

    return {
      dx: filteredX,
      dy: filteredY,
      confidence: motion.confidence
    };
  }

  /**
   * Métodos de utilidad
   */
  private applyKalmanFilter(
    measurement: number,
    filter: typeof this.kalmanX
  ): number {
    // Predicción
    const xPred = filter.x;
    const pPred = filter.p + filter.q;

    // Actualización
    const k = pPred / (pPred + filter.r);
    filter.x = xPred + k * (measurement - xPred);
    filter.p = (1 - k) * pPred;

    return filter.x;
  }

  private validateFrame(frame: FrameData): boolean {
    return frame &&
           frame.data &&
           frame.width > 0 &&
           frame.height > 0;
  }

  /**
   * Métodos públicos adicionales
   */
  public setConfig(config: Partial<MovementConfig>): void {
    Object.assign(this.config, config);
    this.reconfigure();
  }

  public reset(): void {
    this.state = {
      lastFrame: null,
      motionHistory: [],
      stabilityScore: 1,
      frameCount: 0,
      mode: 'normal',
      isCalibrated: false
    };
    this.resetKalmanFilters();
  }

  public getMetrics(): any {
    return {
      stabilityScore: this.state.stabilityScore,
      frameCount: this.state.frameCount,
      mode: this.state.mode,
      isCalibrated: this.state.isCalibrated,
      averageMotion: this.calculateAverageMotion()
    };
  }

  /**
   * Limpieza y disposición
   */
  public dispose(): void {
    try {
      // Limpiar buffers
      Object.values(this.buffers).forEach(buffer => {
        if (buffer instanceof Float32Array) {
          buffer.fill(0);
        } else if (Array.isArray(buffer)) {
          buffer.length = 0;
        }
      });

      // Resetear estado
      this.reset();

    } catch (error) {
      console.error('Error en dispose:', error);
    }
  }

  private resetKalmanFilters(): void {
    this.kalmanX = { x: 0, p: 1, q: 0.1, r: 0.1 };
    this.kalmanY = { x: 0, p: 1, q: 0.1, r: 0.1 };
  }

  private calculateAverageMotion(): number {
    if (!this.state.motionHistory.length) return 0;

    return this.state.motionHistory.reduce(
      (sum, motion) => sum + Math.sqrt(
        motion.dx * motion.dx + motion.dy * motion.dy
      ),
      0
    ) / this.state.motionHistory.length;
  }
}
