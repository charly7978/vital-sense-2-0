export class SignalExtractor {
  private readonly ROI_SIZE = 36;
  private readonly MIN_RED_THRESHOLD = 180;
  private readonly MAX_RED_THRESHOLD = 230;
  private readonly MIN_VALID_PIXELS = 400;
  private lastFingerPresent: boolean = false;
  private readonly STABILITY_THRESHOLD = 6;
  private stabilityCounter: number = 0;
  private frameCounter: number = 0;
  private failedDetections: number = 0;
  private lastRedMedian: number = 0;
  private lastDetectionTime: number = Date.now(); // ⏳ Guardamos cuándo se detectó el dedo por última vez

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
        if (red >= this.MIN_RED_THRESHOLD && red <= this.MAX_RED_THRESHOLD) {
          validPixelCount++;
        }
      }
    }

    let redMedian = this.calculateMedian(redValues);
    const pixelRatio = validPixelCount / (this.ROI_SIZE * this.ROI_SIZE);

    // 🚀 **Suavizado del valor de `redMedian`**
    if (this.lastRedMedian !== 0) {
      redMedian = (this.lastRedMedian * 0.8) + (redMedian * 0.2);
    }
    this.lastRedMedian = redMedian;

    // 🚀 **Detección de dedo mejorada con transición suave**
    const hasValidSignal = 
      redMedian >= this.MIN_RED_THRESHOLD && 
      redMedian <= this.MAX_RED_THRESHOLD && 
      validPixelCount >= this.MIN_VALID_PIXELS;

    if (hasValidSignal) {
      this.stabilityCounter = Math.min(this.stabilityCounter + 1, this.STABILITY_THRESHOLD);
      this.failedDetections = 0;
      this.lastDetectionTime = Date.now(); // ⏳ Guardamos el último tiempo en que se detectó el dedo
    } else {
      this.failedDetections++;
      
      // 🚀 **Si el dedo desaparece, bajamos `stabilityCounter` gradualmente en lugar de resetear**
      const timeSinceLastDetection = (Date.now() - this.lastDetectionTime) / 1000; // ⏳ Segundos sin detección

      if (timeSinceLastDetection < 2) {
        // Si el dedo se fue por menos de 2 segundos, bajamos lentamente
        this.stabilityCounter = Math.max(this.stabilityCounter - 1, 0);
      } else {
        // Si el dedo se fue por más de 2 segundos, reseteamos todo
        console.log("⚠ Dedo ausente por mucho tiempo. Reiniciando detección...");
        this.stabilityCounter = 0;
        this.failedDetections = 0;
        this.lastFingerPresent = false;
      }
    }

    // 🚀 **Reiniciar buffers cada 60 frames para evitar acumulación de ruido**
    this.frameCounter++;
    if (this.frameCounter >= 60) {
      console.log("🔄 Reseteando buffers de detección para mantener estabilidad.");
      this.frameCounter = 0;
      this.stabilityCounter = 0;
      this.failedDetections = 0;
    }

    // 🔴 **Activar/desactivar el estado del dedo con transiciones suaves**
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
      timeSinceLastDetection,
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
