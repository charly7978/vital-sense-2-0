
export class SignalExtractor {
  private readonly ROI_SIZE = 32;
  private readonly MIN_RED_THRESHOLD = 150;
  private readonly MAX_RED_THRESHOLD = 240;
  private readonly MIN_VALID_PIXELS = 20;

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

    // Detección inmediata basada en valor rojo promedio
    const redMedian = this.calculateMedian(redValues);
    const fingerPresent = redMedian >= this.MIN_RED_THRESHOLD;

    // Log inmediato del estado
    console.log('Detección de dedo:', {
      redMedian,
      validPixelCount,
      fingerPresent
    });

    return {
      red: redMedian,
      ir: this.calculateMedian(greenValues),
      quality: validPixelCount / (this.ROI_SIZE * this.ROI_SIZE),
      fingerPresent
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
