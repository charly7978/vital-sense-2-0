
export class SignalExtractor {
  private readonly ROI_SIZE = 32;
  private readonly MIN_RED_THRESHOLD = 135;
  private readonly MAX_RED_THRESHOLD = 240;
  private readonly MIN_VALID_PIXELS = 25;
  private lastFingerPresent: boolean = false;
  private readonly STABILITY_THRESHOLD = 4;
  private stabilityCounter: number = 0;
  
  // Nuevos parámetros para histéresis
  private readonly HYSTERESIS_HIGH = 140; // Umbral alto para activación
  private readonly HYSTERESIS_LOW = 130;  // Umbral bajo para desactivación
  private readonly DEBOUNCE_TIME = 500;   // Tiempo mínimo entre cambios de estado (ms)
  private lastStateChangeTime: number = 0;

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

    // Análisis de píxeles
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
    const now = Date.now();

    // Implementación de histéresis con debounce
    let currentFingerPresent = this.lastFingerPresent;
    
    if (this.lastFingerPresent) {
      // Si el dedo estaba presente, usar umbral bajo para desactivar
      if (redMedian < this.HYSTERESIS_LOW && validPixelCount < this.MIN_VALID_PIXELS) {
        if (now - this.lastStateChangeTime >= this.DEBOUNCE_TIME) {
          currentFingerPresent = false;
          this.lastStateChangeTime = now;
        }
      }
    } else {
      // Si el dedo no estaba presente, usar umbral alto para activar
      if (redMedian > this.HYSTERESIS_HIGH && validPixelCount >= this.MIN_VALID_PIXELS) {
        if (now - this.lastStateChangeTime >= this.DEBOUNCE_TIME) {
          currentFingerPresent = true;
          this.lastStateChangeTime = now;
        }
      }
    }

    // Lógica de estabilidad adicional
    if (currentFingerPresent === this.lastFingerPresent) {
      this.stabilityCounter = Math.min(this.stabilityCounter + 1, this.STABILITY_THRESHOLD);
    } else {
      this.stabilityCounter = Math.max(this.stabilityCounter - 1, 0);
    }

    // Solo cambiamos el estado si hay suficiente estabilidad
    let finalFingerPresent = this.lastFingerPresent;
    if (this.stabilityCounter >= this.STABILITY_THRESHOLD || this.stabilityCounter === 0) {
      finalFingerPresent = currentFingerPresent;
      this.lastFingerPresent = currentFingerPresent;
    }

    // Log detallado para debugging
    console.log('Detección de dedo:', {
      redMedian,
      validPixelCount,
      currentDetection: currentFingerPresent,
      stabilityCounter: this.stabilityCounter,
      finalState: finalFingerPresent,
      timeSinceLastChange: now - this.lastStateChangeTime
    });

    return {
      red: redMedian,
      ir: this.calculateMedian(greenValues),
      quality: validPixelCount / (this.ROI_SIZE * this.ROI_SIZE),
      fingerPresent: finalFingerPresent
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
