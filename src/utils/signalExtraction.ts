export class SignalExtractor {
  private readonly ROI_SIZE = 36;
  private readonly MIN_RED_THRESHOLD = 190;
  private readonly MAX_RED_THRESHOLD = 240;
  private readonly MIN_VALID_PIXELS = 100;
  private lastFingerPresent: boolean = false;
  private readonly STABILITY_THRESHOLD = 6;
  private stabilityCounter: number = 0;
  private failedDetections: number = 0;  // 🚀 Nuevo: Contador de fallos consecutivos
  private frameCounter: number = 0;      // 🚀 Nuevo: Contador global de frames para resetear buffers

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
    
    // 🚀 **Corrección: Si la detección falla 10 veces seguidas, forzamos recalibración**
    const hasValidSignal = redMedian >= this.MIN_RED_THRESHOLD && validPixelCount >= this.MIN_VALID_PIXELS;

    if (hasValidSignal) {
      this.stabilityCounter = Math.min(this.stabilityCounter + 1, this.STABILITY_THRESHOLD);
      this.failedDetections = 0;  // Reseteamos el contador de fallos
    } else {
      this.stabilityCounter = Math.max(this.stabilityCounter - 1, 0);
      this.failedDetections++;  // Incrementamos contador de fallos

      if (this.failedDetections >= 10) {
        console.log("⚠ Muchas detecciones fallidas seguidas. Reseteando detección...");
        this.stabilityCounter = 0;
        this.failedDetections = 0;
        this.lastFingerPresent = false;
      }
    }

    // 🚀 **Corrección: Resetear buffer cada 60 frames para evitar acumulación de ruido**
    this.frameCounter++;
    if (this.frameCounter >= 60) {
      console.log("🔄 Reseteando buffers de detección para mantener estabilidad.");
      this.frameCounter = 0;
      this.stabilityCounter = 0;
      this.failedDetections = 0;
    }

    // 🔴 **Nuevo: Se activa o desactiva el dedo SOLO si la estabilidad alcanza el umbral**
    if (this.stabilityCounter >= this.STABILITY_THRESHOLD) {
      this.lastFingerPresent = true;
    } else if (this.stabilityCounter === 0) {
      this.lastFingerPresent = false;
    }

    // 📌 **Log detallado**
    console.log('🔍 Detección de dedo:', {
      redMedian,
      validPixelCount,
      hasValidSignal,
      stabilityCounter: this.stabilityCounter,
      failedDetections: this.failedDetections,
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
