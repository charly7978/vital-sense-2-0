
export class SignalExtractor {
  private readonly ROI_SIZE = 32;
  private readonly MIN_RED_THRESHOLD = 135;
  private readonly MAX_RED_THRESHOLD = 240;
  private readonly MIN_VALID_PIXELS = 25;
  private lastFingerPresent: boolean = false;
  private readonly STABILITY_THRESHOLD = 4;
  private stabilityCounter: number = 0;
  private lastProcessingTime: number = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33; // ~30fps

  extractChannels(imageData: ImageData): { 
    red: number;
    ir: number;
    quality: number;
    fingerPresent: boolean;
  } {
    const now = Date.now();
    if (now - this.lastProcessingTime < this.MIN_PROCESSING_INTERVAL) {
      return {
        red: 0,
        ir: 0,
        quality: 0,
        fingerPresent: this.lastFingerPresent
      };
    }
    this.lastProcessingTime = now;

    const { width, height, data } = imageData;
    
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const halfROI = Math.floor(this.ROI_SIZE / 2);

    const redValues: number[] = [];
    const greenValues: number[] = [];
    let validPixelCount = 0;
    let totalPixels = 0;

    try {
      // Análisis directo de píxeles
      for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
        for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
          if (y >= 0 && y < height && x >= 0 && x < width) {
            totalPixels++;
            const i = (y * width + x) * 4;
            if (i >= 0 && i < data.length - 3) {
              const red = data[i];
              redValues.push(red);
              greenValues.push(data[i + 1]);
              if (red >= this.MIN_RED_THRESHOLD && red <= this.MAX_RED_THRESHOLD) {
                validPixelCount++;
              }
            }
          }
        }
      }

      const redMedian = this.calculateMedian(redValues);
      const currentFingerPresent = redMedian >= this.MIN_RED_THRESHOLD && 
                                 validPixelCount >= this.MIN_VALID_PIXELS;

      // Lógica de estabilidad mejorada
      if (currentFingerPresent === this.lastFingerPresent) {
        this.stabilityCounter = Math.min(this.stabilityCounter + 1, this.STABILITY_THRESHOLD);
      } else {
        this.stabilityCounter = Math.max(this.stabilityCounter - 1, 0);
      }

      let finalFingerPresent = this.lastFingerPresent;
      if (this.stabilityCounter >= this.STABILITY_THRESHOLD || this.stabilityCounter === 0) {
        finalFingerPresent = currentFingerPresent;
        this.lastFingerPresent = currentFingerPresent;
      }

      const quality = totalPixels > 0 ? validPixelCount / totalPixels : 0;

      // Log detallado para debugging
      console.log('Detección de dedo:', {
        redMedian,
        validPixelCount,
        totalPixels,
        quality: quality.toFixed(2),
        currentDetection: currentFingerPresent,
        stabilityCounter: this.stabilityCounter,
        finalState: finalFingerPresent
      });

      return {
        red: redMedian,
        ir: this.calculateMedian(greenValues),
        quality,
        fingerPresent: finalFingerPresent
      };
    } catch (error) {
      console.error('Error en extracción de señal:', error);
      return {
        red: 0,
        ir: 0,
        quality: 0,
        fingerPresent: false
      };
    }
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }
}
