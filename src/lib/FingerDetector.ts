// src/lib/FingerDetector.ts

import { SignalQualityLevel } from '@/types';

export class FingerDetector {
  // Umbrales optimizados
  private readonly thresholds = {
    minBrightness: 0.3,
    maxBrightness: 0.95,
    redRatio: 0.5,
    greenRatio: 0.3,
    blueRatio: 0.2,
    motionThreshold: 0.1,
    edgeStrength: 0.4,
    textureVariance: 0.15
  };

  // Cache para optimización
  private lastFrameData?: ImageData;
  private lastPosition?: { x: number; y: number };
  private frameCounter = 0;
  private readonly motionHistory: Array<{ x: number; y: number }> = [];
  private readonly maxHistoryLength = 30;

  // Matriz de kernel Sobel para detección de bordes
  private readonly sobelKernelX = [
    [-1, 0, 1],
    [-2, 0, 2],
    [-1, 0, 1]
  ];

  private readonly sobelKernelY = [
    [-1, -2, -1],
    [0, 0, 0],
    [1, 2, 1]
  ];

  public detectFinger(imageData: ImageData): {
    isPresent: boolean;
    position?: { x: number; y: number };
    quality: SignalQualityLevel;
    confidence: number;
    coverage: number;
    metrics: {
      brightness: number;
      contrast: number;
      sharpness: number;
      stability: number;
      colorBalance: number;
    };
  } {
    // Incrementar contador de frames
    this.frameCounter++;

    // Extraer región central
    const centerRegion = this.extractCenterRegion(imageData);
    
    // Análisis completo de la imagen
    const metrics = this.analyzeImage(centerRegion);
    
    // Si no hay suficiente luz o la imagen está saturada
    if (metrics.brightness < this.thresholds.minBrightness || 
        metrics.brightness > this.thresholds.maxBrightness) {
      return this.generateEmptyResult(metrics);
    }

    // Detección de movimiento si hay frame anterior
    const motionScore = this.lastFrameData ? 
      this.detectMotion(centerRegion, this.lastFrameData) : 1;

    // Análisis de textura y bordes
    const textureScore = this.analyzeTexture(centerRegion);
    const edgeScore = this.detectEdges(centerRegion);

    // Análisis de color para piel
    const skinLikelihood = this.analyzeSkinColor(centerRegion);

    // Calcular posición óptima
    const position = this.findOptimalPosition(centerRegion, skinLikelihood);

    // Actualizar historial de movimiento
    this.updateMotionHistory(position);

    // Calcular estabilidad de la posición
    const stability = this.calculateStability();

    // Calcular confianza general
    const confidence = this.calculateConfidence({
      skinLikelihood,
      motionScore,
      textureScore,
      edgeScore,
      stability,
      metrics
    });

    // Determinar calidad de la señal
    const quality = this.determineQuality(confidence);

    // Calcular cobertura
    const coverage = this.calculateCoverage(centerRegion);

    // Actualizar cache
    this.lastFrameData = centerRegion;
    this.lastPosition = position;

    return {
      isPresent: confidence > 0.6,
      position,
      quality,
      confidence,
      coverage,
      metrics: {
        ...metrics,
        stability,
        colorBalance: skinLikelihood
      }
    };
  }

  private extractCenterRegion(imageData: ImageData): ImageData {
    const width = imageData.width;
    const height = imageData.height;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.3);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = regionSize;
    canvas.height = regionSize;

    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d')!;
    tempCanvas.width = width;
    tempCanvas.height = height;
    tempCtx.putImageData(imageData, 0, 0);

    ctx.drawImage(
      tempCanvas,
      centerX - regionSize/2,
      centerY - regionSize/2,
      regionSize,
      regionSize,
      0, 0, regionSize, regionSize
    );

    return ctx.getImageData(0, 0, regionSize, regionSize);
  }

  private analyzeImage(imageData: ImageData): {
    brightness: number;
    contrast: number;
    sharpness: number;
  } {
    let minIntensity = 255;
    let maxIntensity = 0;
    let totalIntensity = 0;
    let variance = 0;

    // Primer paso: calcular intensidad media
    for (let i = 0; i < imageData.data.length; i += 4) {
      const intensity = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
      minIntensity = Math.min(minIntensity, intensity);
      maxIntensity = Math.max(maxIntensity, intensity);
      totalIntensity += intensity;
    }

    const meanIntensity = totalIntensity / (imageData.data.length / 4);

    // Segundo paso: calcular varianza
    for (let i = 0; i < imageData.data.length; i += 4) {
      const intensity = (imageData.data[i] + imageData.data[i+1] + imageData.data[i+2]) / 3;
      variance += Math.pow(intensity - meanIntensity, 2);
    }

    return {
      brightness: meanIntensity / 255,
      contrast: (maxIntensity - minIntensity) / 255,
      sharpness: Math.sqrt(variance / (imageData.data.length / 4)) / 255
    };
  }

  private detectMotion(current: ImageData, previous: ImageData): number {
    let totalDiff = 0;
    const length = Math.min(current.data.length, previous.data.length);

    for (let i = 0; i < length; i += 4) {
      const diff = Math.abs(current.data[i] - previous.data[i]);
      totalDiff += diff;
    }

    return 1 - Math.min(1, totalDiff / (length * 255));
  }

  private analyzeTexture(imageData: ImageData): number {
    const grayScale = this.toGrayscale(imageData);
    let totalVariance = 0;

    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        const neighborhood = this.getNeighborhood(grayScale, x, y);
        const variance = this.calculateVariance(neighborhood);
        totalVariance += variance;
      }
    }

    return Math.min(1, totalVariance / (imageData.width * imageData.height));
  }

  private detectEdges(imageData: ImageData): number {
    const grayScale = this.toGrayscale(imageData);
    let totalGradient = 0;

    for (let y = 1; y < imageData.height - 1; y++) {
      for (let x = 1; x < imageData.width - 1; x++) {
        const gradientX = this.applyKernel(grayScale, x, y, this.sobelKernelX);
        const gradientY = this.applyKernel(grayScale, x, y, this.sobelKernelY);
        const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);
        totalGradient += gradient;
      }
    }

    return Math.min(1, totalGradient / (imageData.width * imageData.height * 255));
  }

  private analyzeSkinColor(imageData: ImageData): number {
    let skinPixels = 0;
    const totalPixels = imageData.width * imageData.height;

    for (let i = 0; i < imageData.data.length; i += 4) {
      const r = imageData.data[i];
      const g = imageData.data[i + 1];
      const b = imageData.data[i + 2];

      // Reglas de detección de piel mejoradas
      if (this.isSkinColor(r, g, b)) {
        skinPixels++;
      }
    }

    return skinPixels / totalPixels;
  }

  private isSkinColor(r: number, g: number, b: number): boolean {
    // Reglas YCbCr para detección de piel
    const y = 0.299 * r + 0.587 * g + 0.114 * b;
    const cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b;
    const cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b;

    return (cr <= 173 && cr >= 133 && 
            cb <= 127 && cb >= 77 && 
            y > 80);
  }

  private findOptimalPosition(
    imageData: ImageData,
    skinLikelihood: number
  ): { x: number; y: number } {
    let maxQuality = 0;
    let bestX = imageData.width / 2;
    let bestY = imageData.height / 2;

    // Búsqueda en grid para la mejor posición
    const gridSize = 5;
    const stepX = imageData.width / gridSize;
    const stepY = imageData.height / gridSize;

    for (let y = stepY/2; y < imageData.height; y += stepY) {
      for (let x = stepX/2; x < imageData.width; x += stepX) {
        const quality = this.evaluatePosition(imageData, x, y);
        if (quality > maxQuality) {
          maxQuality = quality;
          bestX = x;
          bestY = y;
        }
      }
    }

    return { x: bestX, y: bestY };
  }

  private evaluatePosition(
    imageData: ImageData,
    x: number,
    y: number
  ): number {
    const radius = 10;
    let quality = 0;
    let count = 0;

    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const px = Math.floor(x + dx);
        const py = Math.floor(y + dy);

        if (px >= 0 && px < imageData.width && 
            py >= 0 && py < imageData.height) {
          const idx = (py * imageData.width + px) * 4;
          const r = imageData.data[idx];
          const g = imageData.data[idx + 1];
          const b = imageData.data[idx + 2];

          if (this.isSkinColor(r, g, b)) {
            quality += 1;
          }
          count++;
        }
      }
    }

    return count > 0 ? quality / count : 0;
  }

  private updateMotionHistory(position: { x: number; y: number }): void {
    this.motionHistory.push(position);
    if (this.motionHistory.length > this.maxHistoryLength) {
      this.motionHistory.shift();
    }
  }

  private calculateStability(): number {
    if (this.motionHistory.length < 2) return 1;

    let totalMovement = 0;
    for (let i = 1; i < this.motionHistory.length; i++) {
      const dx = this.motionHistory[i].x - this.motionHistory[i-1].x;
      const dy = this.motionHistory[i].y - this.motionHistory[i-1].y;
      totalMovement += Math.sqrt(dx*dx + dy*dy);
    }

    const averageMovement = totalMovement / (this.motionHistory.length - 1);
    return Math.max(0, 1 - averageMovement / 50);
  }

  private calculateConfidence(params: {
    skinLikelihood: number;
    motionScore: number;
    textureScore: number;
    edgeScore: number;
    stability: number;
    metrics: { brightness: number; contrast: number; sharpness: number; }
  }): number {
    const weights = {
      skinLikelihood: 0.3,
      motionScore: 0.15,
      textureScore: 0.15,
      edgeScore: 0.1,
      stability: 0.2,
      brightness: 0.1
    };

    return (
      weights.skinLikelihood * params.skinLikelihood +
      weights.motionScore * params.motionScore +
      weights.textureScore * params.textureScore +
      weights.edgeScore * params.edgeScore +
      weights.stability * params.stability +
      weights.brightness * (1 - Math.abs(params.metrics.brightness - 0.5) * 2)
    );
  }

  private determineQuality(confidence: number): SignalQualityLevel {
    if (confidence > 0.8) return SignalQualityLevel.Excellent;
    if (confidence > 0.6) return SignalQualityLevel.Good;
    if (confidence > 0.4) return SignalQualityLevel.Fair;
    if (confidence > 0.2) return SignalQualityLevel.Poor;
    return SignalQualityLevel.Invalid;
  }

  private calculateCoverage(imageData: ImageData): number {
    let coveredPixels = 0;
    const totalPixels = imageData.width * imageData.height;

    for (let i = 0; i < imageData.data.length; i += 4) {
      if (this.isSkinColor(
        imageData.data[i],
        imageData.data[i + 1],
        imageData.data[i + 2]
      )) {
        coveredPixels++;
      }
    }

    return coveredPixels / totalPixels;
  }

  // Métodos auxiliares
  private toGrayscale(imageData: ImageData): number[][] {
    const gray: number[][] = Array(imageData.height)
      .fill(0)
      .map(() => Array(imageData.width).fill(0));

    for (let y = 0; y < imageData.height; y++) {
      for (let x = 0; x < imageData.width; x++) {
        const idx = (y * imageData.width + x) * 4;
        gray[y][x] = (
          imageData.data[idx] * 0.299 +
          imageData.data[idx + 1] * 0.587 +
          imageData.data[idx + 2] * 0.114
        ) / 255;
      }
    }

    return gray;
  }

  private getNeighborhood(gray: number[][], x: number, y: number): number[] {
    const neighborhood = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        neighborhood.push(gray[y + dy][x + dx]);
      }
    }
    return neighborhood;
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  }

  private applyKernel(
    gray: number[][],
    x: number,
    y: number,
    kernel: number[][]
  ): number {
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        sum += gray[y + dy][x + dx] * kernel[dy + 1][dx + 1];
      }
    }
    return sum;
  }

  private generateEmptyResult(metrics: {
    brightness: number;
    contrast: number;
    sharpness: number;
  }) {
    return {
      isPresent: false,
      quality: SignalQualityLevel.Invalid,
      confidence: 0,
      coverage: 0,
      metrics: {
        ...metrics,
        stability: 0,
        colorBalance: 0
      }
    };
  }
}
