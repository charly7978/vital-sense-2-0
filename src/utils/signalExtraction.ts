
export class SignalExtractor {
  private readonly ROI_SIZE = 48; // Aumentado para capturar más área
  private readonly MIN_RED_THRESHOLD = 100; // Reducido para ser más sensible
  private readonly MAX_RED_THRESHOLD = 255; // Aumentado para captar más variación
  private readonly MIN_VALID_PIXELS = 15; // Reducido para ser más sensible
  private lastFingerPresent: boolean = false;
  private readonly STABILITY_THRESHOLD = 3; // Reducido para respuesta más rápida
  private stabilityCounter: number = 0;
  private lastProcessingTime: number = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33; // ~30fps
  private readonly QUALITY_THRESHOLD = 0.1; // Reducido para ser más permisivo

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
    let maxRed = 0;
    let minRed = 255;

    try {
      // Análisis directo de píxeles con detección de rango dinámico
      for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
        for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
          if (y >= 0 && y < height && x >= 0 && x < width) {
            totalPixels++;
            const i = (y * width + x) * 4;
            if (i >= 0 && i < data.length - 3) {
              const red = data[i];
              redValues.push(red);
              greenValues.push(data[i + 1]);
              
              // Actualizar valores máximo y mínimo
              maxRed = Math.max(maxRed, red);
              minRed = Math.min(minRed, red);

              if (red >= this.MIN_RED_THRESHOLD && red <= this.MAX_RED_THRESHOLD) {
                validPixelCount++;
              }
            }
          }
        }
      }

      const redMedian = this.calculateMedian(redValues);
      const redRange = maxRed - minRed;
      
      // Mejorada la lógica de detección de dedo
      const currentFingerPresent = (
        redMedian >= this.MIN_RED_THRESHOLD && 
        validPixelCount >= this.MIN_VALID_PIXELS &&
        redRange > 10 // Asegurarse de que hay variación en la señal
      );

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

      const quality = this.calculateSignalQuality(redValues, validPixelCount, totalPixels, redRange);

      // Log detallado para debugging
      console.log('Detección de dedo:', {
        redMedian,
        redRange,
        validPixelCount,
        totalPixels,
        quality: quality.toFixed(2),
        currentDetection: currentFingerPresent,
        stabilityCounter: this.stabilityCounter,
        finalState: finalFingerPresent,
        maxRed,
        minRed
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

  private calculateSignalQuality(
    redValues: number[],
    validPixels: number,
    totalPixels: number,
    redRange: number
  ): number {
    const baseQuality = totalPixels > 0 ? validPixels / totalPixels : 0;
    const rangeQuality = Math.min(redRange / 50, 1); // Normalizar el rango
    
    // Combinar métricas de calidad
    return (baseQuality * 0.7 + rangeQuality * 0.3);
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
