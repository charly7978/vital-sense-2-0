
import { SignalFilter } from './signalFilter';

export class SignalExtractor {
  private readonly ROI_SIZE = 64;
  private lastProcessingTime = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33;
  private readonly MIN_VALID_PIXELS_RATIO = 0.6;
  private readonly signalFilter: SignalFilter;
  private redBuffer: number[] = [];
  private readonly BUFFER_SIZE = 30;
  private lastDetectionStates: boolean[] = [];
  private readonly DETECTION_BUFFER_SIZE = 5;
  private readonly MIN_CONSECUTIVE_DETECTIONS = 3;

  constructor() {
    this.signalFilter = new SignalFilter(30);
  }

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

    // Análisis detallado de ROI
    for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
      for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const i = (y * width + x) * 4;
          if (i >= 0 && i < data.length - 3) {
            const red = data[i];
            if (red > 30 && red < 250) {
              redValues.push(red);
              sumRed += red;
              validPixels++;
            }
          }
        }
      }
    }

    const validPixelsRatio = validPixels / (this.ROI_SIZE * this.ROI_SIZE);
    const avgRed = validPixels > 0 ? sumRed / validPixels : 0;

    // Log detallado de la señal raw
    console.log('📷 Diagnóstico de captura:', {
      intensidadRojaPromedio: avgRed,
      pixelesValidos: validPixelsRatio * 100 + '%',
      histograma: this.calcularHistograma(redValues),
      dimensionesROI: {
        ancho: this.ROI_SIZE,
        alto: this.ROI_SIZE,
        centro: { x: centerX, y: centerY }
      }
    });

    // Actualizar buffer y aplicar filtrado
    this.redBuffer.push(avgRed);
    if (this.redBuffer.length > this.BUFFER_SIZE) {
      this.redBuffer.shift();
    }
    
    const filteredRed = this.redBuffer.length >= this.BUFFER_SIZE 
      ? this.signalFilter.lowPassFilter(this.redBuffer)[this.redBuffer.length - 1]
      : avgRed;

    // Análisis estadístico robusto
    redValues.sort((a, b) => a - b);
    const q1Index = Math.floor(redValues.length * 0.25);
    const q3Index = Math.floor(redValues.length * 0.75);
    const q1 = redValues[q1Index] || 0;
    const q3 = redValues[q3Index] || 0;
    const iqr = q3 - q1;

    // Criterios más detallados para detección
    const hasEnoughPixels = validPixelsRatio > this.MIN_VALID_PIXELS_RATIO * 0.8;
    const hasGoodIntensity = filteredRed > 30 && filteredRed < 250;
    const hasGoodDistribution = iqr < 120;

    const currentDetection = hasEnoughPixels && hasGoodIntensity && hasGoodDistribution;

    this.lastDetectionStates.push(currentDetection);
    if (this.lastDetectionStates.length > this.DETECTION_BUFFER_SIZE) {
      this.lastDetectionStates.shift();
    }

    const consecutiveDetections = this.lastDetectionStates.filter(x => x).length;
    const fingerPresent = consecutiveDetections >= Math.floor(this.MIN_CONSECUTIVE_DETECTIONS * 0.7);

    const quality = fingerPresent ? 
      Math.min(1, validPixelsRatio * (consecutiveDetections / this.DETECTION_BUFFER_SIZE)) : 0;

    // Log detallado de análisis
    console.log('🔍 Análisis de señal:', {
      señalRaw: {
        promedio: avgRed,
        filtrada: filteredRed,
        rangoDinamico: iqr
      },
      deteccion: {
        pixelesValidos: hasEnoughPixels,
        intensidadCorrecta: hasGoodIntensity,
        distribucionCorrecta: hasGoodDistribution,
        deteccionActual: currentDetection,
        deteccionesConsecutivas: consecutiveDetections
      },
      resultado: {
        dedoPresente: fingerPresent,
        calidadSeñal: quality * 100 + '%'
      }
    });

    this.lastValidState = {
      red: fingerPresent ? filteredRed : 0,
      ir: 0,
      quality,
      fingerPresent
    };

    return { ...this.lastValidState };
  }

  private calcularHistograma(valores: number[]): { [key: string]: number } {
    const histograma: { [key: string]: number } = {};
    const rangos = ['0-50', '51-100', '101-150', '151-200', '201-255'];
    
    rangos.forEach(rango => histograma[rango] = 0);
    
    valores.forEach(valor => {
      if (valor <= 50) histograma['0-50']++;
      else if (valor <= 100) histograma['51-100']++;
      else if (valor <= 150) histograma['101-150']++;
      else if (valor <= 200) histograma['151-200']++;
      else histograma['201-255']++;
    });
    
    return histograma;
  }
}
