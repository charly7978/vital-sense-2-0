
import { supabase } from '@/integrations/supabase/client';

export class SignalExtractor {
  private readonly ROI_SIZE = 64; // Región de interés más pequeña y precisa
  private readonly MIN_RED_THRESHOLD = 150;
  private readonly MAX_RED_THRESHOLD = 240;
  private readonly MIN_VALID_PIXELS = 40;
  private lastValidReadings: number[] = [];
  private readonly HISTORY_SIZE = 10;

  extractChannels(imageData: ImageData): { 
    red: number; 
    ir: number; 
    quality: number; 
    perfusionIndex: number;
    fingerPresent: boolean;
    diagnostics: {
      redMean: number;
      validPixels: number;
      redDominance: number;
      coverage: number;
    };
  } {
    const { width, height, data } = imageData;
    
    // Centro de la imagen
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const halfROI = Math.floor(this.ROI_SIZE / 2);

    // Arrays para almacenar valores
    const redValues: number[] = [];
    const greenValues: number[] = [];
    const blueValues: number[] = [];
    let validPixelCount = 0;

    // Análisis de píxeles en la región de interés
    for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
      for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

        // Criterios mejorados para detección de píxeles válidos
        if (this.isValidPixel(red, green, blue)) {
          redValues.push(red);
          greenValues.push(green);
          blueValues.push(blue);
          validPixelCount++;
        }
      }
    }

    if (validPixelCount < this.MIN_VALID_PIXELS) {
      console.log('Píxeles válidos insuficientes:', validPixelCount);
      return this.createEmptyResult();
    }

    // Calcular estadísticas robustas
    const redMedian = this.calculateMedian(redValues);
    const greenMedian = this.calculateMedian(greenValues);
    const blueMedian = this.calculateMedian(blueValues);
    
    // Calcular índice de perfusión mejorado
    const perfusionIndex = this.calculatePerfusionIndex(redValues);
    
    // Actualizar historial de lecturas válidas
    if (this.isReadingValid(redMedian, perfusionIndex)) {
      this.lastValidReadings.push(redMedian);
      if (this.lastValidReadings.length > this.HISTORY_SIZE) {
        this.lastValidReadings.shift();
      }
    }

    // Calcular calidad de señal
    const quality = this.calculateSignalQuality(redValues, validPixelCount);
    
    // Detección mejorada de presencia de dedo
    const fingerPresent = this.isFingerPresent(redMedian, quality, perfusionIndex);

    // Log detallado para debugging
    console.log('Análisis de señal:', {
      estado: fingerPresent ? 'DEDO PRESENTE' : 'NO HAY DEDO',
      mediana_rojo: Math.round(redMedian),
      indice_perfusion: perfusionIndex.toFixed(3),
      calidad_senal: quality.toFixed(3),
      pixeles_validos: validPixelCount,
      ultima_lectura: this.lastValidReadings[this.lastValidReadings.length - 1]
    });

    return {
      red: redMedian,
      ir: greenMedian,
      quality,
      perfusionIndex,
      fingerPresent,
      diagnostics: {
        redMean: redMedian,
        validPixels: validPixelCount,
        redDominance: redMedian / (greenMedian || 1),
        coverage: validPixelCount / (this.ROI_SIZE * this.ROI_SIZE)
      }
    };
  }

  private isValidPixel(red: number, green: number, blue: number): boolean {
    return (
      red >= this.MIN_RED_THRESHOLD &&
      red <= this.MAX_RED_THRESHOLD &&
      red > green * 1.5 &&
      red > blue * 1.5 &&
      green < 200 && blue < 200 // Evitar reflexiones especulares
    );
  }

  private calculateMedian(values: number[]): number {
    if (values.length === 0) return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private calculatePerfusionIndex(values: number[]): number {
    if (values.length < 2) return 0;
    const max = Math.max(...values);
    const min = Math.min(...values);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return mean > 0 ? (max - min) / mean : 0;
  }

  private calculateSignalQuality(values: number[], validPixels: number): number {
    if (values.length < 2) return 0;
    
    // Calcular variación de la señal
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalizar calidad entre 0 y 1
    const pixelQuality = validPixels / (this.ROI_SIZE * this.ROI_SIZE);
    const variationQuality = Math.min(stdDev / 30, 1); // 30 es un valor típico de variación para PPG
    
    return pixelQuality * variationQuality;
  }

  private isReadingValid(value: number, perfusionIndex: number): boolean {
    return (
      value >= this.MIN_RED_THRESHOLD &&
      value <= this.MAX_RED_THRESHOLD &&
      perfusionIndex > 0.01 &&
      perfusionIndex < 0.2
    );
  }

  private isFingerPresent(redMedian: number, quality: number, perfusionIndex: number): boolean {
    return (
      redMedian >= this.MIN_RED_THRESHOLD &&
      redMedian <= this.MAX_RED_THRESHOLD &&
      quality > 0.05 && // Reducido de 0.3 a 0.05 basado en los logs
      perfusionIndex > 0.01 &&
      this.lastValidReadings.length >= Math.floor(this.HISTORY_SIZE / 2)
    );
  }

  private createEmptyResult() {
    return {
      red: 0,
      ir: 0,
      quality: 0,
      perfusionIndex: 0,
      fingerPresent: false,
      diagnostics: {
        redMean: 0,
        validPixels: 0,
        redDominance: 0,
        coverage: 0
      }
    };
  }
}
