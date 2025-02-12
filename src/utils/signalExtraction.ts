
export class SignalExtractor {
  private readonly ROI_SIZE = 32;
  private readonly MIN_RED_THRESHOLD = 140;
  private readonly MAX_RED_THRESHOLD = 240;
  private readonly MIN_VALID_PIXELS = 30;
  private lastFingerPresent: boolean = false;
  private readonly STABILITY_THRESHOLD = 3;
  private stabilityCounter: number = 0;

  extractChannels(imageData: ImageData): { 
    red: number;
    ir: number;
    quality: number;
    fingerPresent: boolean;
  } {
    const { width, height, data } = imageData;
    
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const halfROI = Math.floor(this.ROI_SIZE / 2);

    const redValues: number[] = [];
    const greenValues: number[] = [];
    let validPixelCount = 0;

    // Análisis directo de píxeles
    for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
      for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
        const i = (y * width + x) * 4;
        const red = data[i];
        redValues.push(red);
        greenValues.push(data[i + 1]);
        if (red >= this.MIN_RED_THRESHOLD) {
          validPixelCount++;
        }
      }
    }

    const redMedian = this.calculateMedian(redValues);
    const pixelRatio = validPixelCount / (this.ROI_SIZE * this.ROI_SIZE);
    
    // Verificación más estricta de la presencia del dedo
    const hasValidSignal = redMedian >= this.MIN_RED_THRESHOLD && validPixelCount >= this.MIN_VALID_PIXELS;
    const hasStrongSignal = redMedian >= this.MIN_RED_THRESHOLD * 1.5 && validPixelCount >= this.MIN_VALID_PIXELS * 1.2;
    
    // Si no hay señal válida, resetear inmediatamente
    if (!hasValidSignal) {
      this.stabilityCounter = 0;
      this.lastFingerPresent = false;
      return {
        red: redMedian,
        ir: this.calculateMedian(greenValues),
        quality: 0,
        fingerPresent: false
      };
    }

    // Lógica de estabilidad para señales válidas
    if (hasStrongSignal) {
      this.stabilityCounter = this.STABILITY_THRESHOLD; // Detección inmediata para señales fuertes
    } else if (hasValidSignal) {
      this.stabilityCounter = Math.min(this.stabilityCounter + 1, this.STABILITY_THRESHOLD);
    }

    const fingerPresent = this.stabilityCounter >= this.STABILITY_THRESHOLD;
    this.lastFingerPresent = fingerPresent;

    // Log detallado para debugging
    console.log('Detección de dedo:', {
      redMedian,
      validPixelCount,
      hasValidSignal,
      hasStrongSignal,
      stabilityCounter: this.stabilityCounter,
      finalState: fingerPresent,
      pixelRatio
    });

    return {
      red: redMedian,
      ir: this.calculateMedian(greenValues),
      quality: pixelRatio,
      fingerPresent: fingerPresent
    };
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
