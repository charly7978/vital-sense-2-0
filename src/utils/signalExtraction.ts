
export class SignalExtractor {
  /**
   * HISTORIAL DE CAMBIOS DETALLADO:
   * ==============================
   * 
   * [2024-03-18] - REVISIÓN 1
   * Estado inicial: Detección inestable y falsos positivos
   * Problema específico: La señal se perdía en medio de la medición
   * Cambio realizado: Simplificación completa del algoritmo
   * Resultado: No mejoró, seguía inestable
   * Aprendizaje: La simplificación por sí sola no resuelve el problema
   * 
   * [2024-03-18] - REVISIÓN 2
   * Problema: No se detectaba ningún píxel (valores en 0)
   * Causa probable: Umbral demasiado alto
   * Cambio realizado: Reducción de MIN_RED_THRESHOLD a 100
   * Resultado: La detección empeoró
   * Aprendizaje: Bajar el umbral no mejoró la detección
   * 
   * [2024-03-18] - REVISIÓN 3
   * PROBLEMA ACTUAL:
   * - La detección es peor que nunca
   * - Los valores están constantemente en 0
   * - El sistema es inestable
   * 
   * [2024-03-18] - REVISIÓN 4
   * Problema identificado: Umbral (409.6) muy por encima del valor promedio de rojo (167)
   * Cambio a realizar: Reducir MIN_RED_THRESHOLD a 50
   * Hipótesis: Con un umbral más bajo deberíamos detectar más píxeles válidos
   */

  private readonly ROI_SIZE = 64; 
  private readonly MIN_RED_THRESHOLD = 50; // Reducido de 100 a 50
  private lastProcessingTime = 0;
  private readonly MIN_PROCESSING_INTERVAL = 100;

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
      
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const halfROI = Math.floor(this.ROI_SIZE / 2);

      let totalRedValue = 0;
      let pixelCount = 0;
      let maxRed = 0;
      let minRed = 255;
      let totalPixelsAnalyzed = 0;

      // Análisis del centro de la imagen
      for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
        for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
          if (y >= 0 && y < height && x >= 0 && x < width) {
            const i = (y * width + x) * 4;
            if (i >= 0 && i < data.length - 3) {
              const red = data[i];
              maxRed = Math.max(maxRed, red);
              minRed = Math.min(minRed, red);
              totalPixelsAnalyzed++;

              if (red > this.MIN_RED_THRESHOLD) {
                totalRedValue += red;
                pixelCount++;
              }
            }
          }
        }
      }

      const averageRed = pixelCount > 0 ? totalRedValue / pixelCount : 0;
      const fingerPresent = pixelCount > (this.ROI_SIZE * this.ROI_SIZE * 0.4);

      // Log detallado para diagnóstico
      console.log('Análisis de imagen:', {
        dimensiones: {
          width,
          height,
          roiSize: this.ROI_SIZE,
          centro: { x: centerX, y: centerY }
        },
        valores: {
          maxRed,
          minRed,
          averageRed,
          pixelCount,
          totalPixelsAnalyzed,
          umbral: this.MIN_RED_THRESHOLD
        },
        resultado: {
          fingerPresent,
          thresholdPixels: this.ROI_SIZE * this.ROI_SIZE * 0.4
        }
      });

      return {
        red: fingerPresent ? averageRed : 0,
        ir: 0,
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
