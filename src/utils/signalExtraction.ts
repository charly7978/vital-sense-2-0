
export class SignalExtractor {
  private readonly ROI_SIZE = 32;
  private readonly MIN_RED_THRESHOLD = 170; // Aumentado de 155 a 170 para ser más estricto
  private readonly MAX_RED_THRESHOLD = 240;
  private readonly MIN_VALID_PIXELS = 39;
  private lastFingerPresent: boolean = false;
  private readonly STABILITY_THRESHOLD = 4;
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
    
    // Verificación simple de señal válida
    const hasValidSignal = redMedian >= this.MIN_RED_THRESHOLD && validPixelCount >= this.MIN_VALID_PIXELS;
    
    // Lógica de estabilidad simplificada
    if (hasValidSignal) {
      if (!this.lastFingerPresent) {
        this.stabilityCounter++;
        if (this.stabilityCounter >= this.STABILITY_THRESHOLD) {
          this.lastFingerPresent = true;
          // Reset del contador cuando cambiamos a estado detectado
          this.stabilityCounter = 0;
        }
      }
    } else {
      if (this.lastFingerPresent) {
        this.stabilityCounter--;
        if (this.stabilityCounter <= 0) {
          this.lastFingerPresent = false;
          // Reset del contador cuando cambiamos a estado no detectado
          this.stabilityCounter = 0;
        }
      }
    }

    // Log detallado para debugging
    console.log('Detección de dedo:', {
      redMedian,
      validPixelCount,
      hasValidSignal,
      stabilityCounter: this.stabilityCounter,
      finalState: this.lastFingerPresent,
      pixelRatio
    });

    return {
      red: redMedian,
      ir: this.calculateMedian(greenValues),
      quality: pixelRatio,
      fingerPresent: this.lastFingerPresent
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
