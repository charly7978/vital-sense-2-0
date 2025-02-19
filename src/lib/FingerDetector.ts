import { 
  FingerDetection, ROI, ColorProfile, DetectionQuality,
  MotionVector, PerfusionMetrics, TextureAnalysis,
  LightConditions, DetectionError, SignalQualityLevel
} from '@/types';

/**
 * Detector avanzado de dedos optimizado para cámaras traseras sin flash
 * Implementa detección multi-región y análisis de calidad en tiempo real
 * @version 2.0.0
 */
export class FingerDetector {
  // Configuración optimizada para baja luz
  private readonly config = {
    minCoverage: 0.15,        // Cobertura mínima aceptable
    maxRegions: 4,            // Máximo de regiones a analizar
    regionSize: 100,          // Tamaño de región en píxeles
    historySize: 30,          // Frames de historia (1s @ 30fps)
    minLight: 50,             // Nivel mínimo de luz
    maxLight: 240,            // Nivel máximo de luz
    blockSize: 16,            // Tamaño de bloque para análisis
    searchWindow: 16          // Ventana de búsqueda para tracking
  };

  // Umbrales adaptativos basados en luz
  private thresholds = {
    red: { min: 150, max: 255 },
    green: { min: 20, max: 200 },
    blue: { min: 20, max: 180 },
    perfusion: { min: 0.3, max: 0.95 },
    motion: { max: 0.3 },
    texture: { min: 0.4 },
    edge: { min: 0.3 }
  };

  // Estado y tracking
  private state = {
    lastDetection: null as FingerDetection | null,
    detectionHistory: [] as FingerDetection[],
    stabilityScore: 0,
    frameCount: 0,
    lightConditions: 'unknown' as LightConditions,
    errorCount: 0,
    lastError: null as DetectionError | null,
    isCalibrated: false
  };

  // Buffers optimizados
  private readonly buffers = {
    colorProfiles: [] as ColorProfile[],
    motionVectors: [] as MotionVector[],
    texturePatterns: new Float32Array(256),
    edgeStrengths: new Float32Array(256)
  };

  // Matrices de kernel para análisis
  private readonly kernels = {
    sobel: {
      x: [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]],
      y: [[-1, -2, -1], [0, 0, 0], [1, 2, 1]]
    },
    gaussian: [
      [1/16, 2/16, 1/16],
      [2/16, 4/16, 2/16],
      [1/16, 2/16, 1/16]
    ]
  };

  constructor() {
    this.initialize();
  }

  /**
   * Detección principal de dedo
   */
  public detect(frame: ImageData): FingerDetection {
    try {
      // 1. Análisis de condiciones de luz
      const light = this.analyzeLightConditions(frame);
      this.adaptThresholds(light);

      // 2. Pre-procesamiento
      const processed = this.preprocess(frame);

      // 3. Detección de regiones potenciales
      const regions = this.findPotentialRegions(processed);
      if (regions.length === 0) {
        return this.createEmptyDetection('No se encontraron regiones válidas');
      }

      // 4. Análisis detallado de cada región
      const analyzedRegions = regions.map(region => this.analyzeRegion(frame, region));

      // 5. Selección de mejor región
      const bestRegion = this.selectBestRegion(analyzedRegions);

      // 6. Análisis de calidad
      const quality = this.assessQuality(frame, bestRegion);

      // 7. Tracking y estabilidad
      this.updateTracking(bestRegion);

      // 8. Generación de resultado
      const detection = this.createDetection(bestRegion, quality);

      // 9. Actualización de estado
      this.updateState(detection);

      return detection;

    } catch (error) {
      return this.handleDetectionError(error);
    }
  }

  /**
   * Análisis de condiciones de luz
   */
  private analyzeLightConditions(frame: ImageData): LightConditions {
    const luminance = this.calculateAverageLuminance(frame);
    
    if (luminance < this.config.minLight) {
      this.adaptToLowLight();
      return 'low';
    } else if (luminance > this.config.maxLight) {
      this.adaptToHighLight();
      return 'high';
    }
    
    return 'normal';
  }

  /**
   * Pre-procesamiento de frame
   */
  private preprocess(frame: ImageData): ImageData {
    // 1. Reducción de ruido
    const denoised = this.applyGaussianBlur(frame);

    // 2. Mejora de contraste
    const enhanced = this.enhanceContrast(denoised);

    // 3. Normalización de color
    const normalized = this.normalizeColors(enhanced);

    return normalized;
  }

  /**
   * Búsqueda de regiones potenciales
   */
  private findPotentialRegions(frame: ImageData): ROI[] {
    const regions: ROI[] = [];
    const gridSize = Math.floor(Math.sqrt(this.config.maxRegions));
    const stepX = frame.width / gridSize;
    const stepY = frame.height / gridSize;

    for (let y = 0; y < frame.height - this.config.regionSize; y += stepY) {
      for (let x = 0; x < frame.width - this.config.regionSize; x += stepX) {
        const roi = { x, y, width: this.config.regionSize, height: this.config.regionSize };
        if (this.isValidRegion(frame, roi)) {
          regions.push(roi);
        }
      }
    }

    return this.filterBestRegions(regions);
  }

  /**
   * Análisis detallado de región
   */
  private analyzeRegion(frame: ImageData, roi: ROI): RegionAnalysis {
    // 1. Análisis de color
    const colorProfile = this.analyzeColor(frame, roi);

    // 2. Análisis de textura
    const textureAnalysis = this.analyzeTexture(frame, roi);

    // 3. Detección de bordes
    const edgeAnalysis = this.detectEdges(frame, roi);

    // 4. Análisis de movimiento
    const motionAnalysis = this.analyzeMotion(roi);

    // 5. Análisis de perfusión
    const perfusion = this.analyzePerfusion(frame, roi);

    return {
      roi,
      colorProfile,
      textureAnalysis,
      edgeAnalysis,
      motionAnalysis,
      perfusion,
      score: this.calculateRegionScore({
        colorProfile,
        textureAnalysis,
        edgeAnalysis,
        motionAnalysis,
        perfusion
      })
    };
  }

  /**
   * Análisis de color avanzado
   */
  private analyzeColor(frame: ImageData, roi: ROI): ColorProfile {
    const pixels = this.extractROIPixels(frame, roi);
    const channels = this.separateChannels(pixels);
    
    return {
      mean: this.calculateChannelMeans(channels),
      std: this.calculateChannelStd(channels),
      ratios: this.calculateChannelRatios(channels),
      histogram: this.calculateColorHistogram(channels),
      skinLikelihood: this.calculateSkinLikelihood(channels)
    };
  }

  /**
   * Análisis de textura
   */
  private analyzeTexture(frame: ImageData, roi: ROI): TextureAnalysis {
    // 1. Cálculo de GLCM
    const glcm = this.calculateGLCM(frame, roi);

    // 2. Características de Haralick
    const haralick = this.calculateHaralickFeatures(glcm);

    // 3. Patrones binarios locales
    const lbp = this.calculateLBP(frame, roi);

    // 4. Análisis de gradiente
    const gradient = this.analyzeGradient(frame, roi);

    return {
      contrast: haralick.contrast,
      correlation: haralick.correlation,
      energy: haralick.energy,
      homogeneity: haralick.homogeneity,
      lbpPattern: lbp,
      gradientMagnitude: gradient.magnitude,
      gradientDirection: gradient.direction
    };
  }

  /**
   * Análisis de calidad
   */
  private assessQuality(frame: ImageData, region: RegionAnalysis): DetectionQuality {
    const metrics = {
      colorQuality: this.assessColorQuality(region.colorProfile),
      textureQuality: this.assessTextureQuality(region.textureAnalysis),
      motionQuality: this.assessMotionQuality(region.motionAnalysis),
      perfusionQuality: this.assessPerfusionQuality(region.perfusion),
      stabilityQuality: this.state.stabilityScore
    };

    const weights = this.calculateQualityWeights(metrics);
    const overallQuality = this.calculateOverallQuality(metrics, weights);

    return {
      metrics,
      weights,
      overall: overallQuality,
      level: this.determineQualityLevel(overallQuality)
    };
  }

  /**
   * Tracking y estabilidad
   */
  private updateTracking(region: RegionAnalysis): void {
    if (this.state.lastDetection) {
      const motion = this.calculateMotion(
        region.roi,
        this.state.lastDetection.roi
      );

      this.buffers.motionVectors.push(motion);
      if (this.buffers.motionVectors.length > this.config.historySize) {
        this.buffers.motionVectors.shift();
      }

      this.state.stabilityScore = this.calculateStabilityScore(
        this.buffers.motionVectors
      );
    }
  }

  /**
   * Métodos de utilidad
   */
  private calculateAverageLuminance(frame: ImageData): number {
    let sum = 0;
    for (let i = 0; i < frame.data.length; i += 4) {
      sum += (frame.data[i] * 0.299 + 
              frame.data[i + 1] * 0.587 + 
              frame.data[i + 2] * 0.114);
    }
    return sum / (frame.data.length / 4);
  }

  private isValidRegion(frame: ImageData, roi: ROI): boolean {
    return roi.x >= 0 && 
           roi.y >= 0 && 
           roi.x + roi.width <= frame.width &&
           roi.y + roi.height <= frame.height;
  }

  private calculateStabilityScore(motions: MotionVector[]): number {
    if (motions.length < 2) return 1;

    const totalMotion = motions.reduce((sum, motion) => 
      sum + Math.sqrt(motion.dx * motion.dx + motion.dy * motion.dy), 0);

    return Math.max(0, 1 - totalMotion / (motions.length * 10));
  }

  /**
   * Manejo de errores
   */
  private handleDetectionError(error: any): FingerDetection {
    this.state.errorCount++;
    this.state.lastError = {
      message: error.message,
      timestamp: Date.now(),
      frame: this.state.frameCount
    };

    console.error('Error en detección:', {
      error,
      state: this.state,
      thresholds: this.thresholds
    });

    return this.createEmptyDetection(error.message);
  }

  /**
   * Métodos públicos adicionales
   */
  public getMetrics(): DetectionMetrics {
    return {
      frameCount: this.state.frameCount,
      errorRate: this.state.errorCount / this.state.frameCount,
      stability: this.state.stabilityScore,
      lightConditions: this.state.lightConditions,
      isCalibrated: this.state.isCalibrated
    };
  }

  public reset(): void {
    this.state = {
      lastDetection: null,
      detectionHistory: [],
      stabilityScore: 0,
      frameCount: 0,
      lightConditions: 'unknown',
      errorCount: 0,
      lastError: null,
      isCalibrated: false
    };
    this.resetBuffers();
  }

  public dispose(): void {
    this.reset();
    this.clearBuffers();
  }
}
