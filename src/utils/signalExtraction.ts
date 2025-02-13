
export class SignalExtractor {
  /**
   * HISTORIAL DE CAMBIOS DETALLADO:
   * ==============================
   * 
   * [2024-03-18] - REVISIÓN 7
   * OBJETIVO: Eliminar la inestabilidad del sistema
   * 
   * CAMBIOS CRÍTICOS:
   * 1. Implementación de buffer temporal para suavizar detección
   * 2. Sistema de histéresis para evitar falsos cambios
   * 3. Ventana de análisis más grande (64x64)
   * 4. Filtrado de ruido mejorado
   */

  private readonly ROI_SIZE = 64;
  private lastProcessingTime = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33;
  private readonly MIN_VALID_PIXELS_RATIO = 0.6;
  
  // Buffer para estabilidad
  private lastDetectionStates: boolean[] = [];
  private readonly DETECTION_BUFFER_SIZE = 5;
  private readonly MIN_CONSECUTIVE_DETECTIONS = 3;

  // Mantener último estado válido
  private lastValidState = {
    red: 0,
    ir: 0,
    quality: 0,
    fingerPresent: false
  };

  extractChannels(imageData: ImageData): { 
    red: number;
    ir: number;
    quality: number;
    fingerPresent: boolean;
  } {
    const now = Date.now();
    if (now - this.lastProcessingTime < this.MIN_PROCESSING_INTERVAL) {
      // Devolver último estado válido sin cambios
      return { ...this.lastValidState };
    }
    this.lastProcessingTime = now;

    const { width, height, data } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const halfROI = Math.floor(this.ROI_SIZE / 2);

    let validPixels = 0;
    let sumRed = 0;
    let redValues: number[] = [];

    // Análisis de ROI más grande para mejor estabilidad
    for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
      for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const i = (y * width + x) * 4;
          if (i >= 0 && i < data.length - 3) {
            const red = data[i];
            // Filtrado de ruido mejorado
            if (red > 40 && red < 250) { // Rango más permisivo
              redValues.push(red);
              sumRed += red;
              validPixels++;
            }
          }
        }
      }
    }

    // Análisis estadístico robusto
    const validPixelsRatio = validPixels / (this.ROI_SIZE * this.ROI_SIZE);
    const avgRed = validPixels > 0 ? sumRed / validPixels : 0;

    // Ordenar para análisis de distribución
    redValues.sort((a, b) => a - b);
    const q1Index = Math.floor(redValues.length * 0.25);
    const q3Index = Math.floor(redValues.length * 0.75);
    const q1 = redValues[q1Index] || 0;
    const q3 = redValues[q3Index] || 0;
    const iqr = q3 - q1;

    // Criterios más robustos para detección
    const hasEnoughPixels = validPixelsRatio > this.MIN_VALID_PIXELS_RATIO;
    const hasGoodIntensity = avgRed > 60 && avgRed < 250;
    const hasGoodDistribution = iqr < 100; // Asegura uniformidad en la señal

    // Detección inicial
    const currentDetection = hasEnoughPixels && hasGoodIntensity && hasGoodDistribution;

    // Sistema de histéresis para estabilidad
    this.lastDetectionStates.push(currentDetection);
    if (this.lastDetectionStates.length > this.DETECTION_BUFFER_SIZE) {
      this.lastDetectionStates.shift();
    }

    // Solo cambiamos estado si hay suficientes detecciones consecutivas
    const consecutiveDetections = this.lastDetectionStates.filter(x => x).length;
    const fingerPresent = consecutiveDetections >= this.MIN_CONSECUTIVE_DETECTIONS;

    // Calidad basada en estabilidad
    const quality = fingerPresent ? Math.min(1, validPixelsRatio * (consecutiveDetections / this.DETECTION_BUFFER_SIZE)) : 0;

    // Actualizar último estado válido
    this.lastValidState = {
      red: fingerPresent ? avgRed : 0,
      ir: 0,
      quality,
      fingerPresent
    };

    // Log detallado
    console.log('Análisis de señal PPG:', {
      estadísticas: {
        promedio: avgRed,
        pixelesValidos: validPixelsRatio,
        q1,
        q3,
        iqr,
        deteccionesConsecutivas: consecutiveDetections
      },
      criterios: {
        suficientesPixeles: hasEnoughPixels,
        intensidadBuena: hasGoodIntensity,
        distribucionBuena: hasGoodDistribution
      },
      resultado: {
        deteccionActual: currentDetection,
        dedoPresente: fingerPresent,
        calidadSeñal: quality
      }
    });

    return { ...this.lastValidState };
  }
}
