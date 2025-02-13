
export class SignalExtractor {
  /**
   * HISTORIAL DE CAMBIOS:
   * 
   * [2024-03-18] - REINICIO COMPLETO
   * - Problema: Inestabilidad en la detección y falsos positivos
   * - Solución: Reimplementación completa con lógica simplificada
   * - Enfoque: Solo detectar presencia de dedo de forma confiable
   * 
   * PRINCIPIO DE FUNCIONAMIENTO:
   * 1. Analiza solo el centro de la imagen (ROI pequeña)
   * 2. Un dedo presente bloqueará la luz, resultando en una imagen más oscura
   * 3. Detectamos esto midiendo la cantidad de píxeles rojos brillantes
   */

  private readonly ROI_SIZE = 32; // Región más pequeña para mayor estabilidad
  private readonly MIN_RED_THRESHOLD = 150; // Umbral más estricto
  private lastProcessingTime = 0;
  private readonly MIN_PROCESSING_INTERVAL = 100; // Aumentado para mayor estabilidad

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
        fingerPresent: false
      };
    }
    this.lastProcessingTime = now;

    try {
      const { width, height, data } = imageData;
      
      // Solo analizamos el centro exacto de la imagen
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const halfROI = Math.floor(this.ROI_SIZE / 2);

      let totalRedValue = 0;
      let pixelCount = 0;

      // Análisis simple del centro de la imagen
      for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
        for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
          if (y >= 0 && y < height && x >= 0 && x < width) {
            const i = (y * width + x) * 4;
            if (i >= 0 && i < data.length - 3) {
              const red = data[i];
              if (red > this.MIN_RED_THRESHOLD) {
                totalRedValue += red;
                pixelCount++;
              }
            }
          }
        }
      }

      // Cálculo simple: si hay suficientes píxeles rojos brillantes, hay un dedo
      const averageRed = pixelCount > 0 ? totalRedValue / pixelCount : 0;
      const fingerPresent = pixelCount > (this.ROI_SIZE * this.ROI_SIZE * 0.4);

      // Log simplificado para debugging
      console.log('Detección básica:', {
        averageRed,
        pixelCount,
        threshold: this.ROI_SIZE * this.ROI_SIZE * 0.4,
        fingerPresent
      });

      return {
        red: fingerPresent ? averageRed : 0,
        ir: 0, // No usamos IR por ahora
        quality: fingerPresent ? pixelCount / (this.ROI_SIZE * this.ROI_SIZE) : 0,
        fingerPresent
      };
    } catch (error) {
      console.error('Error en detección:', error);
      return {
        red: 0,
        ir: 0,
        quality: 0,
        fingerPresent: false
      };
    }
  }
}
