
export class SignalExtractor {
  private readonly ROI_SIZE = 64;
  private lastProcessingTime = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33;
  private readonly MIN_VALID_PIXELS_RATIO = 0.6;
  private readonly signalBuffer: number[] = [];
  private readonly BUFFER_SIZE = 30;
  private lastValidState = {
    red: 0,
    quality: 0,
    fingerPresent: false
  };

  extractSignal(imageData: ImageData): { 
    red: number;
    quality: number;
    fingerPresent: boolean;
  } {
    const now = Date.now();
    if (now - this.lastProcessingTime < this.MIN_PROCESSING_INTERVAL) {
      return { ...this.lastValidState };
    }
    this.lastProcessingTime = now;

    const { width, height, data } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const halfROI = Math.floor(this.ROI_SIZE / 2);

    let validPixels = 0;
    let sumRed = 0;
    let redValues: number[] = [];

    // Análisis de ROI
    for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
      for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const i = (y * width + x) * 4;
          const red = data[i];
          if (red > 50 && red < 250) {
            redValues.push(red);
            sumRed += red;
            validPixels++;
          }
        }
      }
    }

    const validPixelsRatio = validPixels / (this.ROI_SIZE * this.ROI_SIZE);
    const avgRed = validPixels > 0 ? sumRed / validPixels : 0;

    console.log('📷 Análisis de frame:', {
      promedioRojo: avgRed,
      pixelesValidos: validPixelsRatio,
      intensidad: sumRed / (this.ROI_SIZE * this.ROI_SIZE)
    });

    // Actualizar buffer
    this.signalBuffer.push(avgRed);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }

    // Análisis de calidad
    const quality = this.calculateSignalQuality(redValues, validPixelsRatio);
    const fingerPresent = quality > 0.3;

    this.lastValidState = {
      red: fingerPresent ? avgRed : 0,
      quality,
      fingerPresent
    };

    return { ...this.lastValidState };
  }

  private calculateSignalQuality(redValues: number[], validPixelsRatio: number): number {
    if (redValues.length === 0 || validPixelsRatio < this.MIN_VALID_PIXELS_RATIO) {
      return 0;
    }

    // Ordenar valores para análisis estadístico
    redValues.sort((a, b) => a - b);
    const q1 = redValues[Math.floor(redValues.length * 0.25)];
    const q3 = redValues[Math.floor(redValues.length * 0.75)];
    const iqr = q3 - q1;
    const median = redValues[Math.floor(redValues.length * 0.5)];

    // Calcular calidad basada en múltiples factores
    const intensityQuality = Math.min(1, Math.max(0, (median - 50) / 150));
    const distributionQuality = Math.max(0, 1 - iqr / 100);
    const coverageQuality = Math.min(1, validPixelsRatio / this.MIN_VALID_PIXELS_RATIO);

    const quality = (
      intensityQuality * 0.4 +
      distributionQuality * 0.3 +
      coverageQuality * 0.3
    );

    console.log('🔍 Análisis de calidad:', {
      intensidad: intensityQuality,
      distribucion: distributionQuality,
      cobertura: coverageQuality,
      calidadFinal: quality
    });

    return quality;
  }
}
