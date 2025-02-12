
export class SignalExtractor {
  private readonly ROI_SIZE = 32;
  private readonly MIN_RED_THRESHOLD = 140;
  private readonly MAX_RED_THRESHOLD = 240;
  private readonly MIN_VALID_PIXELS = 30;
  private lastFingerPresent: boolean = false;
  private readonly STABILITY_THRESHOLD = 3;
  private stabilityCounter: number = 0;
  private readonly INSTABILITY_THRESHOLD = 5; // Nuevo: cuántos frames malos necesitamos para considerar inestabilidad
  private instabilityCounter: number = 0; // Nuevo: contador de frames inestables

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
    
    // Verificación de señal válida
    const hasValidSignal = redMedian >= this.MIN_RED_THRESHOLD && validPixelCount >= this.MIN_VALID_PIXELS;
    const hasStrongSignal = redMedian >= this.MIN_RED_THRESHOLD * 1.5 && validPixelCount >= this.MIN_VALID_PIXELS * 1.2;
    
    // Lógica de estabilidad mejorada
    if (hasStrongSignal) {
      // Señal fuerte: incrementar estabilidad, resetear inestabilidad
      this.stabilityCounter = Math.min(this.stabilityCounter + 2, this.STABILITY_THRESHOLD);
      this.instabilityCounter = 0;
    } else if (hasValidSignal) {
      // Señal válida: incrementar estabilidad gradualmente, resetear inestabilidad
      this.stabilityCounter = Math.min(this.stabilityCounter + 1, this.STABILITY_THRESHOLD);
      this.instabilityCounter = 0;
    } else {
      // Señal inválida: incrementar inestabilidad
      this.instabilityCounter++;
      // Solo reducimos estabilidad si hay suficiente inestabilidad acumulada
      if (this.instabilityCounter >= this.INSTABILITY_THRESHOLD) {
        this.stabilityCounter = Math.max(0, this.stabilityCounter - 1);
      }
    }

    // Determinación del estado final
    const fingerPresent = this.stabilityCounter >= this.STABILITY_THRESHOLD;
    
    // Solo actualizamos lastFingerPresent cuando hay un cambio definitivo
    if (fingerPresent !== this.lastFingerPresent && 
        (fingerPresent ? this.stabilityCounter >= this.STABILITY_THRESHOLD : this.instabilityCounter >= this.INSTABILITY_THRESHOLD)) {
      this.lastFingerPresent = fingerPresent;
    }

    // Log detallado para debugging
    console.log('Detección de dedo:', {
      redMedian,
      validPixelCount,
      hasValidSignal,
      hasStrongSignal,
      stabilityCounter: this.stabilityCounter,
      instabilityCounter: this.instabilityCounter,
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
