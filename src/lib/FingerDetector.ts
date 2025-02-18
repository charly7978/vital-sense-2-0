// ==================== FingerDetector.ts ====================

export class FingerDetector {
  // OPTIMIZACIÓN: Pesos del modelo ML simplificado
  private readonly MODEL_WEIGHTS = {
    redIntensity: 0.35,    // Importancia del canal rojo
    irRatio: 0.25,         // Importancia del ratio IR
    coverage: 0.20,        // Importancia de la cobertura
    texture: 0.10,         // Importancia de la textura
    motion: 0.10          // Importancia del movimiento
  };

  // OPTIMIZACIÓN: Umbrales mejorados
  private readonly THRESHOLDS = {
    minRedValue: 35,
    maxRedValue: 150,
    minIrValue: 25,
    minCoverage: 0.6,
    minQuality: 0.45,
    minStability: 0.7
  };

  // OPTIMIZACIÓN: Buffer para análisis temporal
  private readonly historySize = 10;
  private detectionHistory: boolean[] = [];
  private featureHistory: number[][] = [];
  private lastDetection: boolean = false;
  private confidenceScore: number = 0;

  detectFinger(imageData: ImageData): DetectionResult {
    try {
      // OPTIMIZACIÓN: Extracción de características mejorada
      const features = this.extractFeatures(imageData);
      
      // OPTIMIZACIÓN: Evaluación multi-característica
      const score = this.evaluateFeatures(features);
      
      // OPTIMIZACIÓN: Análisis temporal
      const temporalScore = this.analyzeTemporalConsistency(score);
      
      // OPTIMIZACIÓN: Decisión final mejorada
      const isFingerPresent = this.makeDecision(temporalScore);
      
      // OPTIMIZACIÓN: Actualización de histórico
      this.updateHistory(isFingerPresent, features.rawValues);

      return {
        isPresent: isFingerPresent,
        confidence: this.confidenceScore,
        quality: features.quality,
        debug: {
          redIntensity: features.redIntensity,
          irRatio: features.irRatio,
          coverage: features.coverage,
          texture: features.texture,
          motion: features.motion,
          score: score,
          temporalScore: temporalScore
        }
      };
    } catch (error) {
      console.error('Error en detección de dedo:', error);
      return this.getEmptyDetection();
    }
  }

  // OPTIMIZACIÓN: Extracción de características avanzada
  private extractFeatures(imageData: ImageData): FeatureSet {
    const { width, height, data } = imageData;
    
    // OPTIMIZACIÓN: Análisis de región central
    const margin = Math.floor(Math.min(width, height) * 0.2);
    const centerRegion = this.extractCenterRegion(imageData, margin);
    
    // OPTIMIZACIÓN: Características básicas
    const redIntensity = this.calculateRedIntensity(centerRegion);
    const irRatio = this.calculateIRRatio(centerRegion);
    const coverage = this.calculateCoverage(centerRegion);
    
    // OPTIMIZACIÓN: Análisis de textura avanzado
    const texture = this.analyzeTexture(centerRegion);
    
    // OPTIMIZACIÓN: Análisis de movimiento
    const motion = this.analyzeMotion(centerRegion);
    
    // OPTIMIZACIÓN: Cálculo de calidad
    const quality = this.calculateQuality({
      redIntensity,
      irRatio,
      coverage,
      texture,
      motion
    });

    return {
      redIntensity,
      irRatio,
      coverage,
      texture,
      motion,
      quality,
      rawValues: [redIntensity, irRatio, coverage, texture, motion]
    };
  }

  // OPTIMIZACIÓN: Evaluación de características mejorada
  private evaluateFeatures(features: FeatureSet): number {
    let score = 0;
    
    // OPTIMIZACIÓN: Ponderación de características
    score += features.redIntensity * this.MODEL_WEIGHTS.redIntensity;
    score += features.irRatio * this.MODEL_WEIGHTS.irRatio;
    score += features.coverage * this.MODEL_WEIGHTS.coverage;
    score += features.texture * this.MODEL_WEIGHTS.texture;
    score += features.motion * this.MODEL_WEIGHTS.motion;
    
    // OPTIMIZACIÓN: Normalización mejorada
    return this.normalizeScore(score);
  }

  // OPTIMIZACIÓN: Análisis temporal mejorado
  private analyzeTemporalConsistency(currentScore: number): number {
    if (this.detectionHistory.length < 2) return currentScore;
    
    // OPTIMIZACIÓN: Análisis de tendencia
    const trend = this.calculateTrend();
    
    // OPTIMIZACIÓN: Análisis de estabilidad
    const stability = this.calculateStability();
    
    // OPTIMIZACIÓN: Score temporal
    return (currentScore * 0.6 + trend * 0.2 + stability * 0.2);
  }

  // OPTIMIZACIÓN: Decisión final mejorada
  private makeDecision(score: number): boolean {
    // OPTIMIZACIÓN: Histéresis para evitar fluctuaciones
    const hysteresis = this.lastDetection ? 0.05 : 0;
    const threshold = 0.75 - hysteresis;
    
    const decision = score > threshold;
    this.confidenceScore = Math.min(Math.max((score - threshold) * 2, 0), 1);
    
    return decision;
  }

  // OPTIMIZACIÓN: Análisis de textura mejorado
  private analyzeTexture(region: ImageData): number {
    const grayScale = this.convertToGrayscale(region);
    
    // OPTIMIZACIÓN: GLCM (Gray-Level Co-Occurrence Matrix)
    const glcm = this.calculateGLCM(grayScale);
    
    // OPTIMIZACIÓN: Características de textura
    const contrast = this.calculateContrast(glcm);
    const homogeneity = this.calculateHomogeneity(glcm);
    const energy = this.calculateEnergy(glcm);
    
    return (contrast * 0.3 + homogeneity * 0.4 + energy * 0.3);
  }

  // OPTIMIZACIÓN: Análisis de movimiento mejorado
  private analyzeMotion(region: ImageData): number {
    if (this.featureHistory.length < 2) return 1;
    
    // OPTIMIZACIÓN: Diferencia entre frames
    const currentFeatures = this.extractBasicFeatures(region);
    const lastFeatures = this.featureHistory[this.featureHistory.length - 1];
    
    // OPTIMIZACIÓN: Cálculo de movimiento
    const movement = this.calculateMovement(currentFeatures, lastFeatures);
    
    return Math.exp(-movement * 2);
  }

  // OPTIMIZACIÓN: Métodos auxiliares mejorados
  private calculateRedIntensity(region: ImageData): number {
    const data = region.data;
    let sum = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i];
    }
    
    const mean = sum / (data.length / 4);
    return this.normalizeValue(mean, this.THRESHOLDS.minRedValue, this.THRESHOLDS.maxRedValue);
  }

  private calculateIRRatio(region: ImageData): number {
    const data = region.data;
    let redSum = 0;
    let irSum = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      redSum += data[i];
      irSum += data[i + 2];
    }
    
    const ratio = redSum / (irSum + 1e-6);
    return this.normalizeValue(ratio, 1.2, 2.5);
  }

  private calculateCoverage(region: ImageData): number {
    const data = region.data;
    let coveredPixels = 0;
    let totalPixels = 0;
    
    for (let i = 0; i < data.length; i += 4) {
      if (data[i] >= this.THRESHOLDS.minRedValue && 
          data[i] <= this.THRESHOLDS.maxRedValue) {
        coveredPixels++;
      }
      totalPixels++;
    }
    
    return coveredPixels / totalPixels;
  }

  private normalizeValue(value: number, min: number, max: number): number {
    return Math.min(Math.max((value - min) / (max - min), 0), 1);
  }

  private normalizeScore(score: number): number {
    return Math.min(Math.max(score, 0), 1);
  }

  private updateHistory(detection: boolean, features: number[]) {
    this.detectionHistory.push(detection);
    this.featureHistory.push(features);
    
    if (this.detectionHistory.length > this.historySize) {
      this.detectionHistory.shift();
      this.featureHistory.shift();
    }
    
    this.lastDetection = detection;
  }

  private getEmptyDetection(): DetectionResult {
    return {
      isPresent: false,
      confidence: 0,
      quality: 0,
      debug: {
        redIntensity: 0,
        irRatio: 0,
        coverage: 0,
        texture: 0,
        motion: 0,
        score: 0,
        temporalScore: 0
      }
    };
  }
}

// OPTIMIZACIÓN: Tipos mejorados
interface FeatureSet {
  redIntensity: number;
  irRatio: number;
  coverage: number;
  texture: number;
  motion: number;
  quality: number;
  rawValues: number[];
}

interface DetectionResult {
  isPresent: boolean;
  confidence: number;
  quality: number;
  debug: {
    redIntensity: number;
    irRatio: number;
    coverage: number;
    texture: number;
    motion: number;
    score: number;
    temporalScore: number;
  };
}