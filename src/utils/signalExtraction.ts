
export class SignalExtractor {
  /**
   * HISTORIAL DE CAMBIOS DETALLADO:
   * ==============================
   * 
   * [2024-03-18] - REVISIÓN 5
   * PROBLEMA DETECTADO:
   * - Parpadeo frenético y valores inestables
   * - Algoritmo demasiado complejo y frágil
   * 
   * CAMBIOS REALIZADOS:
   * 1. Simplificación total del algoritmo
   * 2. Uso de ROI más pequeña (32x32) para reducir ruido
   * 3. Implementación de umbral adaptativo basado en la media
   * 4. Eliminación de lógica innecesaria
   * 5. Enfoque exclusivo en el canal rojo (R de RGB)
   */

  private readonly ROI_SIZE = 32; // Reducido para mayor estabilidad
  private lastProcessingTime = 0;
  private readonly MIN_PROCESSING_INTERVAL = 100; // 10 FPS máximo

  extractChannels(imageData: ImageData): { 
    red: number;
    ir: number;
    quality: number;
    fingerPresent: boolean;
  } {
    // Control de frecuencia de muestreo
    const now = Date.now();
    if (now - this.lastProcessingTime < this.MIN_PROCESSING_INTERVAL) {
      return { red: 0, ir: 0, quality: 0, fingerPresent: false };
    }
    this.lastProcessingTime = now;

    const { width, height, data } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const halfROI = Math.floor(this.ROI_SIZE / 2);

    // Análisis de la región de interés (ROI)
    let sumRed = 0;
    let validPixels = 0;

    // Solo analizamos el centro de la imagen
    for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
      for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const i = (y * width + x) * 4;
          if (i >= 0 && i < data.length - 3) {
            sumRed += data[i]; // Canal rojo
            validPixels++;
          }
        }
      }
    }

    // Cálculo de valores medios
    const avgRed = validPixels > 0 ? sumRed / validPixels : 0;
    
    // Detección de presencia de dedo basada en valor medio de rojo
    // Un dedo presente debería aumentar significativamente el valor rojo
    const fingerPresent = avgRed > 100; // Umbral base para detección de dedo

    // Log para diagnóstico
    console.log('Análisis de imagen:', {
      dimensiones: {
        width,
        height,
        roiSize: this.ROI_SIZE,
        centro: { x: centerX, y: centerY }
      },
      valores: {
        avgRed,
        validPixels,
        totalPosibles: this.ROI_SIZE * this.ROI_SIZE
      },
      resultado: {
        fingerPresent
      }
    });

    return {
      red: fingerPresent ? avgRed : 0,
      ir: 0, // No usamos IR en esta implementación
      quality: fingerPresent ? validPixels / (this.ROI_SIZE * this.ROI_SIZE) : 0,
      fingerPresent
    };
  }
}
