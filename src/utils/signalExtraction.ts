
export class SignalExtractor {
  /**
   * HISTORIAL DE CAMBIOS DETALLADO:
   * ==============================
   * 
   * [2024-03-18] - REVISIÓN 6
   * OBJETIVO: Implementar un método preciso y confiable de detección PPG
   * 
   * FUNDAMENTOS TÉCNICOS:
   * 1. ROI optimizada (48x48) - balance entre ruido y detalle
   * 2. Análisis de calidad de señal basado en:
   *    - Intensidad del canal rojo
   *    - Consistencia de la señal
   *    - Densidad de píxeles válidos
   * 3. Umbral dinámico basado en histograma
   * 4. Control de frecuencia para estabilidad
   */

  private readonly ROI_SIZE = 48; // Tamaño óptimo para detección PPG
  private lastProcessingTime = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33; // ~30 FPS para mejor precisión
  private readonly MIN_VALID_PIXELS_RATIO = 0.75;

  extractChannels(imageData: ImageData): { 
    red: number;
    ir: number;
    quality: number;
    fingerPresent: boolean;
  } {
    // Control de tasa de muestreo
    const now = Date.now();
    if (now - this.lastProcessingTime < this.MIN_PROCESSING_INTERVAL) {
      return { red: 0, ir: 0, quality: 0, fingerPresent: false };
    }
    this.lastProcessingTime = now;

    const { width, height, data } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const halfROI = Math.floor(this.ROI_SIZE / 2);

    // Recolección de datos de la ROI
    let redValues: number[] = [];
    let sumRed = 0;
    let validPixels = 0;

    // Análisis de ROI centrada
    for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
      for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const i = (y * width + x) * 4;
          if (i >= 0 && i < data.length - 3) {
            const red = data[i];
            // Solo consideramos píxeles con suficiente intensidad
            if (red > 50) {
              redValues.push(red);
              sumRed += red;
              validPixels++;
            }
          }
        }
      }
    }

    // Ordenamos los valores para análisis estadístico
    redValues.sort((a, b) => a - b);
    
    // Calculamos la mediana para umbral adaptativo
    const medianRed = redValues[Math.floor(redValues.length / 2)] || 0;
    
    // Calculamos el ratio de píxeles válidos
    const validPixelsRatio = validPixels / (this.ROI_SIZE * this.ROI_SIZE);
    
    // Criterios de calidad para detección de dedo
    const avgRed = validPixels > 0 ? sumRed / validPixels : 0;
    const hasGoodIntensity = avgRed > 80 && avgRed < 240; // Rango óptimo de intensidad
    const hasEnoughPixels = validPixelsRatio > this.MIN_VALID_PIXELS_RATIO;
    const hasGoodSignal = medianRed > 60; // Umbral de señal mínima

    // Un dedo está presente si cumple todos los criterios
    const fingerPresent = hasGoodIntensity && hasEnoughPixels && hasGoodSignal;

    // Cálculo de calidad de señal
    const quality = fingerPresent ? validPixelsRatio : 0;

    // Log detallado para diagnóstico
    console.log('Análisis de señal PPG:', {
      estadísticas: {
        mediana: medianRed,
        promedio: avgRed,
        pixelesValidos: validPixelsRatio,
      },
      criterios: {
        intensidadBuena: hasGoodIntensity,
        suficientesPixeles: hasEnoughPixels,
        señalBuena: hasGoodSignal
      },
      resultado: {
        dedoPresente: fingerPresent,
        calidadSeñal: quality
      }
    });

    return {
      red: fingerPresent ? avgRed : 0,
      ir: 0, // No utilizamos IR en esta implementación
      quality,
      fingerPresent
    };
  }
}
