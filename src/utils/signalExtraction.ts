
export class SignalExtractor {
  private readonly ROI_SIZE = 48;
  private readonly MIN_RED_THRESHOLD = 135;
  private readonly MAX_RED_THRESHOLD = 255;
  private readonly MIN_VALID_PIXELS = 30;
  private lastFingerPresent: boolean = false;
  private readonly STABILITY_THRESHOLD = 8; // Aumentado para requerir más frames consecutivos
  private readonly STABILITY_RESET_THRESHOLD = 4; // Nuevo: umbral para resetear la estabilidad
  private stabilityCounter: number = 0;
  private lastProcessingTime: number = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33;
  private readonly MIN_RED_DOMINANCE = 1.3;
  private readonly MIN_SIGNAL_QUALITY = 0.4;
  private readonly MIN_VALID_PIXEL_RATIO = 0.4; // Reducido para ser menos estricto
  private consecutiveNegatives: number = 0; // Nuevo: contador para detecciones negativas consecutivas

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
    const blueValues: number[] = [];
    let validPixelCount = 0;
    let totalPixels = 0;
    let maxRed = 0;
    let minRed = 255;

    try {
      // Análisis de píxeles con detección mejorada
      for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
        for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
          if (y >= 0 && y < height && x >= 0 && x < width) {
            totalPixels++;
            const i = (y * width + x) * 4;
            if (i >= 0 && i < data.length - 3) {
              const red = data[i];
              const green = data[i + 1];
              const blue = data[i + 2];
              
              redValues.push(red);
              greenValues.push(green);
              blueValues.push(blue);
              
              maxRed = Math.max(maxRed, red);
              minRed = Math.min(minRed, red);

              // Verificar dominancia del canal rojo
              const redDominance = red / Math.max(green, blue);
              
              if (red >= this.MIN_RED_THRESHOLD && 
                  red <= this.MAX_RED_THRESHOLD && 
                  redDominance >= this.MIN_RED_DOMINANCE) {
                validPixelCount++;
              }
            }
          }
        }
      }

      const redMedian = this.calculateMedian(redValues);
      const redRange = maxRed - minRed;
      const validPixelRatio = validPixelCount / totalPixels;
      const quality = this.calculateSignalQuality(redValues, validPixelCount, totalPixels, redRange);
      
      // Lógica mejorada de detección de dedo con histéresis
      const currentFingerPresent = (
        redMedian >= this.MIN_RED_THRESHOLD && 
        validPixelRatio >= this.MIN_VALID_PIXEL_RATIO &&
        redRange >= 20 &&
        quality >= this.MIN_SIGNAL_QUALITY
      );

      // Nueva lógica de estabilidad con histéresis
      if (currentFingerPresent) {
        this.consecutiveNegatives = 0;
        this.stabilityCounter = Math.min(this.stabilityCounter + 1, this.STABILITY_THRESHOLD);
      } else {
        this.consecutiveNegatives++;
        if (this.consecutiveNegatives >= this.STABILITY_RESET_THRESHOLD) {
          this.stabilityCounter = Math.max(0, this.stabilityCounter - 2); // Reducción gradual
        }
      }

      const finalFingerPresent = this.stabilityCounter >= this.STABILITY_THRESHOLD * 0.75; // Histéresis
      this.lastFingerPresent = finalFingerPresent;

      // Log detallado para debugging
      console.log('Detección de dedo:', {
        redMedian,
        redRange,
        validPixelRatio,
        validPixelCount,
        totalPixels,
        quality: quality.toFixed(2),
        currentDetection: currentFingerPresent,
        stabilityCounter: this.stabilityCounter,
        consecutiveNegatives: this.consecutiveNegatives,
        finalState: finalFingerPresent,
        maxRed,
        minRed
      });

      return {
        red: finalFingerPresent ? redMedian : 0,
        ir: finalFingerPresent ? this.calculateMedian(greenValues) : 0,
        quality: finalFingerPresent ? quality : 0,
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
    if (validPixels === 0 || totalPixels === 0) return 0;
    
    const validPixelRatio = validPixels / totalPixels;
    const rangeQuality = Math.min(redRange / 100, 1);
    const varianceQuality = this.calculateVarianceQuality(redValues);
    
    // Ponderación de factores de calidad
    return (
      validPixelRatio * 0.4 +
      rangeQuality * 0.3 +
      varianceQuality * 0.3
    );
  }

  private calculateVarianceQuality(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    // Normalizar varianza a un rango razonable para PPG
    return Math.min(variance / 1000, 1);
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
