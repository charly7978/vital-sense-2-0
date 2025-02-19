import {
  ImageConfig, ProcessingResult, ColorSpace,
  ROIDetection, ImageEnhancement, ColorAnalysis,
  NoiseReduction, EdgeDetection, ImageQuality,
  AdaptiveFilter, ImageMetrics, ProcessingMode
} from '@/types';

/**
 * Procesador avanzado de imágenes para PPG
 * Implementa técnicas de última generación en procesamiento visual
 * @version 2.0.0
 */
export class ImageProcessor {
  // Configuración optimizada
  private readonly config: ImageConfig = {
    resolution: {
      width: 1280,
      height: 720
    },
    roi: {
      minSize: 100,        // Píxeles
      maxSize: 400,        // Píxeles
      aspectRatio: 1.0,    // Cuadrado
      margin: 20           // Píxeles
    },
    processing: {
      colorSpace: 'YCbCr', // Espacio de color óptimo
      channelWeights: [0.5, 0.3, 0.2],
      denoise: {
        method: 'nlm',     // Non-Local Means
        strength: 10,
        patchSize: 7,
        searchSize: 21
      },
      enhancement: {
        contrast: 1.2,
        brightness: 1.1,
        saturation: 1.0,
        sharpness: 1.1
      }
    },
    analysis: {
      histogramBins: 256,
      edgeThreshold: 30,
      noiseEstimation: 'mad', // Median Absolute Deviation
      qualityMetrics: [
        'contrast',
        'sharpness',
        'noise',
        'exposure'
      ]
    },
    optimization: {
      vectorization: true,
      parallelization: true,
      cacheSize: 5,
      precision: 'high'
    }
  };

  // Procesadores especializados
  private readonly roiDetector: ROIDetection;
  private readonly enhancer: ImageEnhancement;
  private readonly colorAnalyzer: ColorAnalysis;
  private readonly noiseReducer: NoiseReduction;
  private readonly edgeDetector: EdgeDetection;
  private readonly qualityAnalyzer: ImageQuality;

  // Buffers optimizados
  private readonly buffers = {
    rgb: new Uint8Array(1280 * 720 * 3),
    ycbcr: new Uint8Array(1280 * 720 * 3),
    gray: new Uint8Array(1280 * 720),
    edges: new Uint8Array(1280 * 720),
    mask: new Uint8Array(1280 * 720),
    temp: new Uint8Array(1280 * 720 * 3)
  };

  // Cache de procesamiento
  private readonly cache = new Map<string, ProcessingResult>();
  private readonly frameHistory: ImageData[] = [];

  constructor() {
    this.initializeProcessor();
  }

  /**
   * Procesamiento principal de imagen
   * Implementa pipeline completo de procesamiento visual
   */
  public process(frame: ImageData): ProcessingResult {
    try {
      // 1. Validación de frame
      if (!this.validateFrame(frame)) {
        throw new Error('Invalid frame for processing');
      }

      // 2. Cache check
      const cacheKey = this.generateCacheKey(frame);
      const cached = this.checkCache(cacheKey);
      if (cached) return cached;

      // 3. Pre-procesamiento
      const prepared = this.prepareFrame(frame);

      // 4. Detección de ROI
      const roi = this.detectROI(prepared);

      // 5. Reducción de ruido
      const denoised = this.reduceNoise(
        this.extractROI(prepared, roi)
      );

      // 6. Mejora de imagen
      const enhanced = this.enhanceImage(denoised);

      // 7. Análisis de color
      const colorAnalysis = this.analyzeColor(enhanced);

      // 8. Detección de bordes
      const edges = this.detectEdges(enhanced);

      // 9. Análisis de calidad
      const quality = this.analyzeQuality(
        enhanced,
        edges,
        colorAnalysis
      );

      // 10. Resultado final
      const result = {
        processed: enhanced,
        roi,
        quality,
        colorAnalysis,
        edges
      };

      // 11. Cache update
      this.updateCache(cacheKey, result);
      this.updateHistory(frame);

      return result;

    } catch (error) {
      console.error('Error in image processing:', error);
      return this.handleProcessingError(error);
    }
  }

  /**
   * Detección avanzada de ROI
   */
  private detectROI(frame: ImageData): ROIDetection {
    // 1. Conversión a escala de grises
    const gray = this.convertToGrayscale(frame);

    // 2. Detección de piel
    const skinMask = this.detectSkin(frame);

    // 3. Detección de bordes
    const edges = this.detectEdges(frame);

    // 4. Análisis de movimiento
    const motion = this.analyzeMotion(
      frame,
      this.frameHistory
    );

    // 5. Fusión de información
    const roi = this.fuseROIInformation(
      gray,
      skinMask,
      edges,
      motion
    );

    // 6. Validación de ROI
    return this.validateROI(roi);
  }

  /**
   * Reducción avanzada de ruido
   */
  private reduceNoise(image: ImageData): ImageData {
    // 1. Estimación de ruido
    const noiseLevel = this.estimateNoiseLevel(image);

    // 2. Selección de parámetros
    const params = this.selectDenoiseParameters(noiseLevel);

    // 3. Aplicación de filtro NLM
    const denoised = this.applyNLMFilter(
      image,
      params
    );

    // 4. Preservación de bordes
    return this.preserveEdges(denoised, image);
  }

  /**
   * Mejora adaptativa de imagen
   */
  private enhanceImage(image: ImageData): ImageData {
    // 1. Análisis de histograma
    const histogram = this.analyzeHistogram(image);

    // 2. Ajuste de contraste
    const contrasted = this.adjustContrast(
      image,
      histogram
    );

    // 3. Ajuste de brillo
    const brightened = this.adjustBrightness(
      contrasted,
      histogram
    );

    // 4. Mejora de nitidez
    const sharpened = this.enhanceSharpness(brightened);

    // 5. Balance de color
    return this.balanceColor(sharpened);
  }

  /**
   * Análisis avanzado de color
   */
  private analyzeColor(image: ImageData): ColorAnalysis {
    // 1. Conversión de espacio de color
    const ycbcr = this.convertToYCbCr(image);

    // 2. Análisis de canales
    const channels = this.analyzeChannels(ycbcr);

    // 3. Análisis de distribución
    const distribution = this.analyzeColorDistribution(
      channels
    );

    // 4. Análisis de uniformidad
    const uniformity = this.analyzeColorUniformity(
      channels
    );

    return {
      channels,
      distribution,
      uniformity,
      metrics: this.calculateColorMetrics(channels)
    };
  }

  /**
   * Detección robusta de bordes
   */
  private detectEdges(image: ImageData): Uint8Array {
    // 1. Suavizado Gaussiano
    const smoothed = this.applyGaussianSmooth(image);

    // 2. Gradientes direccionales
    const gradients = this.computeGradients(smoothed);

    // 3. Supresión no máxima
    const suppressed = this.applyNonMaxSuppression(
      gradients
    );

    // 4. Umbralización adaptativa
    return this.applyAdaptiveThreshold(suppressed);
  }

  /**
   * Análisis de calidad de imagen
   */
  private analyzeQuality(
    image: ImageData,
    edges: Uint8Array,
    colorAnalysis: ColorAnalysis
  ): ImageQuality {
    // 1. Métricas de nitidez
    const sharpness = this.calculateSharpnessMetrics(
      image,
      edges
    );

    // 2. Métricas de ruido
    const noise = this.calculateNoiseMetrics(image);

    // 3. Métricas de exposición
    const exposure = this.calculateExposureMetrics(
      colorAnalysis
    );

    // 4. Métricas de contraste
    const contrast = this.calculateContrastMetrics(
      image
    );

    return {
      sharpness,
      noise,
      exposure,
      contrast,
      overall: this.calculateOverallQuality([
        sharpness,
        noise,
        exposure,
        contrast
      ])
    };
  }

  /**
   * Optimizaciones de bajo nivel
   */
  private convertToYCbCr(rgb: ImageData): Uint8Array {
    const ycbcr = this.buffers.ycbcr;
    const data = rgb.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      
      ycbcr[i] = 0.299 * r + 0.587 * g + 0.114 * b;
      ycbcr[i + 1] = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
      ycbcr[i + 2] = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;
    }
    
    return ycbcr;
  }

  private applyNLMFilter(
    image: ImageData,
    params: {
      patchSize: number;
      searchSize: number;
      h: number;
    }
  ): ImageData {
    const { patchSize, searchSize, h } = params;
    const result = new ImageData(
      image.width,
      image.height
    );
    const data = image.data;
    const out = result.data;
    
    for (let y = 0; y < image.height; y++) {
      for (let x = 0; x < image.width; x++) {
        const i = (y * image.width + x) * 4;
        let sum = [0, 0, 0];
        let weights = 0;
        
        // Búsqueda de parches similares
        for (let sy = -searchSize; sy <= searchSize; sy++) {
          for (let sx = -searchSize; sx <= searchSize; sx++) {
            const ny = y + sy;
            const nx = x + sx;
            
            if (ny < 0 || ny >= image.height ||
                nx < 0 || nx >= image.width) {
              continue;
            }
            
            // Cálculo de similitud de parches
            const weight = this.calculatePatchSimilarity(
              data,
              i,
              (ny * image.width + nx) * 4,
              patchSize,
              h
            );
            
            weights += weight;
            for (let c = 0; c < 3; c++) {
              sum[c] += weight * data[i + c];
            }
          }
        }
        
        // Normalización
        for (let c = 0; c < 3; c++) {
          out[i + c] = sum[c] / weights;
        }
        out[i + 3] = data[i + 3]; // Alpha
      }
    }
    
    return result;
  }

  /**
   * Gestión de cache y recursos
   */
  private updateCache(key: string, result: ProcessingResult): void {
    // Limpieza de cache si necesario
    if (this.cache.size >= this.config.optimization.cacheSize) {
      const oldestKey = this.cache.keys().next().value;
      this.cache.delete(oldestKey);
    }
    
    this.cache.set(key, result);
  }

  private updateHistory(frame: ImageData): void {
    this.frameHistory.push(frame);
    if (this.frameHistory.length > 5) {
      this.frameHistory.shift();
    }
  }

  public dispose(): void {
    try {
      // 1. Limpieza de procesadores
      this.roiDetector.dispose();
      this.enhancer.dispose();
      this.colorAnalyzer.dispose();
      this.noiseReducer.dispose();
      this.edgeDetector.dispose();
      this.qualityAnalyzer.dispose();

      // 2. Limpieza de buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // 3. Limpieza de cache
      this.cache.clear();
      this.frameHistory.length = 0;

    } catch (error) {
      console.error('Error in dispose:', error);
    }
  }
}
