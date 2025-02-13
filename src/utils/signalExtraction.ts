
import { SignalFilter } from './signalFilter';

export class SignalExtractor {
  /**
   * HISTORIAL DE CAMBIOS DETALLADO:
   * ==============================
   * 
   * [2024-03-18] - REVISIÓN 8
   * OBJETIVO: Mejorar el filtrado de ruido
   * CAMBIO: Integración con SignalFilter para mejor procesamiento de señal
   * AUTOR: Lovable AI
   * 
   * [2024-03-18] - REVISIÓN 7
   * OBJETIVO: Documentar los cambios del sistema
   * CAMBIO: Añadido sistema de documentación para seguimiento de modificaciones
   * AUTOR: Lovable AI
   * 
   * PRÓXIMOS CAMBIOS PENDIENTES:
   * - Implementación de buffer temporal
   * - Sistema de histéresis
   * - Ajuste de ventana de análisis
   */

  private readonly ROI_SIZE = 64;
  private lastProcessingTime = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33;
  private readonly MIN_VALID_PIXELS_RATIO = 0.6;
  private readonly signalFilter: SignalFilter;
  
  // Buffer para estabilidad y filtrado
  private redBuffer: number[] = [];
  private readonly BUFFER_SIZE = 30; // 1 segundo a 30fps
  private lastDetectionStates: boolean[] = [];
  private readonly DETECTION_BUFFER_SIZE = 5;
  private readonly MIN_CONSECUTIVE_DETECTIONS = 3;

  constructor() {
    this.signalFilter = new SignalFilter(30); // 30fps
  }

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

    // Análisis de ROI
    for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
      for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const i = (y * width + x) * 4;
          if (i >= 0 && i < data.length - 3) {
            const red = data[i];
            // Filtrado inicial más permisivo
            if (red > 30 && red < 250) {
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

    // Actualizar buffer y aplicar filtrado
    this.redBuffer.push(avgRed);
    if (this.redBuffer.length > this.BUFFER_SIZE) {
      this.redBuffer.shift();
    }
    
    // Aplicar filtrado avanzado solo si hay suficientes muestras
    const filteredRed = this.redBuffer.length >= this.BUFFER_SIZE 
      ? this.signalFilter.lowPassFilter(this.redBuffer)[this.redBuffer.length - 1]
      : avgRed;

    // Análisis de distribución con señal filtrada
    redValues.sort((a, b) => a - b);
    const q1Index = Math.floor(redValues.length * 0.25);
    const q3Index = Math.floor(redValues.length * 0.75);
    const q1 = redValues[q1Index] || 0;
    const q3 = redValues[q3Index] || 0;
    const iqr = q3 - q1;

    // Criterios más robustos para detección
    const hasEnoughPixels = validPixelsRatio > this.MIN_VALID_PIXELS_RATIO;
    const hasGoodIntensity = filteredRed > 40 && filteredRed < 250;
    const hasGoodDistribution = iqr < 100;

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

    // Calidad basada en estabilidad y señal filtrada
    const quality = fingerPresent ? 
      Math.min(1, validPixelsRatio * (consecutiveDetections / this.DETECTION_BUFFER_SIZE)) : 0;

    // Actualizar último estado válido
    this.lastValidState = {
      red: fingerPresent ? filteredRed : 0,
      ir: 0,
      quality,
      fingerPresent
    };

    // Log detallado
    console.log('Análisis de señal PPG:', {
      estadísticas: {
        promedioOriginal: avgRed,
        promedioFiltrado: filteredRed,
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
