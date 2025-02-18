export class FingerDetector {
  private readonly MIN_RED_THRESHOLD = 50;
  private readonly MIN_COVERAGE = 0.3;
  private readonly ROI_MARGIN = 0.2;
  private lastConfidence = 0;

  detectFinger(imageData: ImageData): { isPresent: boolean; confidence: number } {
    if (!imageData || !imageData.data) {
      return { isPresent: false, confidence: 0 };
    }

    try {
      const { redLevel, coverage } = this.analyzeImage(imageData);
      const confidence = this.calculateConfidence(redLevel, coverage);
      
      // Suavizado temporal de la confianza
      this.lastConfidence = this.lastConfidence * 0.7 + confidence * 0.3;
      
      return {
        isPresent: this.lastConfidence > 0.5,
        confidence: this.lastConfidence
      };
    } catch (error) {
      console.error('Error detectando dedo:', error);
      return { isPresent: false, confidence: 0 };
    }
  }

  extractFeatures(imageData: ImageData): {
    redMean: number;
    redStdDev: number;
    coverage: number;
    brightness: number;
  } {
    const { data, width, height } = imageData;
    const margin = Math.floor(Math.min(width, height) * this.ROI_MARGIN);
    let redSum = 0;
    let redSquareSum = 0;
    let pixelCount = 0;
    let coveredPixels = 0;

    // Analizar solo la región central
    for (let y = margin; y < height - margin; y++) {
      for (let x = margin; x < width - margin; x++) {
        const i = (y * width + x) * 4;
        const red = data[i];
        
        redSum += red;
        redSquareSum += red * red;
        pixelCount++;
        
        if (red > this.MIN_RED_THRESHOLD) {
          coveredPixels++;
        }
      }
    }

    const redMean = redSum / pixelCount;
    const redVariance = (redSquareSum / pixelCount) - (redMean * redMean);
    const redStdDev = Math.sqrt(Math.max(0, redVariance));
    const coverage = coveredPixels / pixelCount;
    const brightness = redMean / 255;

    return {
      redMean,
      redStdDev,
      coverage,
      brightness
    };
  }

  private analyzeImage(imageData: ImageData): { redLevel: number; coverage: number } {
    const features = this.extractFeatures(imageData);
    
    return {
      redLevel: features.redMean / 255,
      coverage: features.coverage
    };
  }

  private calculateConfidence(redLevel: number, coverage: number): number {
    if (coverage < this.MIN_COVERAGE) {
      return 0;
    }

    const redConfidence = Math.max(0, Math.min(1, redLevel));
    const coverageConfidence = Math.max(0, Math.min(1, coverage / 0.8));
    
    // Ponderación de factores
    return redConfidence * 0.7 + coverageConfidence * 0.3;
  }
}
