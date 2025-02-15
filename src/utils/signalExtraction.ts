
export class SignalExtractor {
  private readonly ROI_SIZE = 64;
  private readonly MIN_RED_VALUE = 50;
  private readonly MAX_RED_VALUE = 250;
  private readonly MIN_VALID_PIXELS = 0.3;
  private readonly BUFFER_SIZE = 30;
  private signalBuffer: number[] = [];
  private lastProcessingTime = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33; // ~30fps

  extractSignal(imageData: ImageData): {
    red: number;
    ir: number;
    quality: number;
    fingerPresent: boolean;
  } {
    const now = Date.now();
    if (now - this.lastProcessingTime < this.MIN_PROCESSING_INTERVAL) {
      return { red: 0, ir: 0, quality: 0, fingerPresent: false };
    }
    this.lastProcessingTime = now;

    const { width, height, data } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const halfROI = Math.floor(this.ROI_SIZE / 2);

    let redSum = 0;
    let irSum = 0;
    let validPixels = 0;
    const redValues: number[] = [];

    // Análisis de ROI central
    for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
      for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          
          if (r > this.MIN_RED_VALUE && r < this.MAX_RED_VALUE) {
            redSum += r;
            irSum += g;
            redValues.push(r);
            validPixels++;
          }
        }
      }
    }

    const validPixelsRatio = validPixels / (this.ROI_SIZE * this.ROI_SIZE);
    const avgRed = validPixels > 0 ? redSum / validPixels : 0;
    const avgIR = validPixels > 0 ? irSum / validPixels : 0;

    console.log('📸 Análisis de frame:', {
      pixelesValidos: validPixelsRatio,
      promedioRojo: avgRed,
      promedioIR: avgIR
    });

    // Actualizar buffer
    this.signalBuffer.push(avgRed);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.shift();
    }

    // Calcular calidad de señal
    const quality = this.calculateSignalQuality(redValues, validPixelsRatio);
    const fingerPresent = quality > 0.3;

    return {
      red: fingerPresent ? avgRed : 0,
      ir: fingerPresent ? avgIR : 0,
      quality,
      fingerPresent
    };
  }

  private calculateSignalQuality(redValues: number[], validPixelsRatio: number): number {
    if (redValues.length === 0 || validPixelsRatio < this.MIN_VALID_PIXELS) {
      return 0;
    }

    // Análisis estadístico
    redValues.sort((a, b) => a - b);
    const q1 = redValues[Math.floor(redValues.length * 0.25)];
    const q3 = redValues[Math.floor(redValues.length * 0.75)];
    const iqr = q3 - q1;
    const median = redValues[Math.floor(redValues.length * 0.5)];

    // Factores de calidad
    const intensityQuality = Math.min(1, Math.max(0, (median - this.MIN_RED_VALUE) / 150));
    const distributionQuality = Math.max(0, 1 - iqr / 100);
    const coverageQuality = Math.min(1, validPixelsRatio / this.MIN_VALID_PIXELS);

    const quality = (
      intensityQuality * 0.4 +
      distributionQuality * 0.3 +
      coverageQuality * 0.3
    );

    return quality;
  }
}
