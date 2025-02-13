
export class SignalExtractor {
  private readonly ROI_SIZE = 48;
  private readonly MIN_RED_THRESHOLD = 80; // Reducido para mayor sensibilidad
  private readonly MAX_RED_THRESHOLD = 255;
  private lastFingerPresent: boolean = false;
  private lastProcessingTime: number = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33;

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
    let maxRed = 0;
    let minRed = 255;
    let totalBrightPixels = 0;

    try {
      // Análisis simplificado de píxeles
      for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
        for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
          if (y >= 0 && y < height && x >= 0 && x < width) {
            const i = (y * width + x) * 4;
            if (i >= 0 && i < data.length - 3) {
              const red = data[i];
              const green = data[i + 1];
              
              redValues.push(red);
              greenValues.push(green);
              
              maxRed = Math.max(maxRed, red);
              minRed = Math.min(minRed, red);

              // Contar píxeles brillantes
              if (red > this.MIN_RED_THRESHOLD) {
                totalBrightPixels++;
              }
            }
          }
        }
      }

      const redMedian = this.calculateMedian(redValues);
      const redRange = maxRed - minRed;

      // Lógica simplificada de detección basada en mediana y rango
      const fingerPresent = (
        redMedian > this.MIN_RED_THRESHOLD && 
        redRange > 30 && // Asegurar variación significativa
        totalBrightPixels > 100 // Asegurar área mínima de detección
      );

      this.lastFingerPresent = fingerPresent;

      // Log simple y directo de valores críticos
      console.log('Detección de dedo:', {
        redMedian,
        redRange,
        totalBrightPixels,
        fingerPresent,
        maxRed,
        minRed
      });

      return {
        red: fingerPresent ? redMedian : 0,
        ir: fingerPresent ? this.calculateMedian(greenValues) : 0,
        quality: fingerPresent ? redRange / 255 : 0,
        fingerPresent
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
