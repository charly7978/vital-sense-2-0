
import { ProcessingSettings } from './types';

interface ExtractedSignals {
  red: number;
  ir: number;
  quality: number;
  perfusionIndex: number;
}

export class SignalExtractor {
  private readonly qualityThreshold = 0.2;
  private readonly minIntensity = 15;
  private readonly maxIntensity = 250;
  private lastRed = 0;
  private lastIr = 0;
  private frameCount = 0;
  private processingSettings: ProcessingSettings = {
    measurementDuration: 30,
    minFramesForCalculation: 30,
    minPeaksForValidHR: 3,
    minPeakDistance: 500,
    maxPeakDistance: 1500,
    peakThresholdFactor: 0.5,
    minRedValue: 20,
    minRedDominance: 1.5,
    minValidPixelsRatio: 0.3,
    minBrightness: 30,
    minValidReadings: 10,
    fingerDetectionDelay: 1000,
    minSpO2: 80
  };

  updateSettings(settings: Partial<ProcessingSettings>) {
    this.processingSettings = { ...this.processingSettings, ...settings };
  }

  extractChannels(imageData: ImageData): ExtractedSignals {
    this.frameCount++;
    try {
      let redSum = 0;
      let irSum = 0;
      let pixelCount = 0;
      let saturationCount = 0;
      let darkPixelCount = 0;
      let maxRedIntensity = 0;
      let minRedIntensity = 255;
      let validRedPixels = 0;
      
      const width = imageData.width;
      const height = imageData.height;
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const regionSize = Math.min(100, Math.floor(Math.min(width, height) / 2));
      
      // Analizar región central más pequeña
      for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
        for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const i = (y * width + x) * 4;
            const red = imageData.data[i];
            const green = imageData.data[i+1];
            const blue = imageData.data[i+2];
            
            // Reducir umbral mínimo para detección de dedo
            if (red > 15) {
              validRedPixels++;
            }
            
            maxRedIntensity = Math.max(maxRedIntensity, red);
            minRedIntensity = Math.min(minRedIntensity, red);
            
            if (red < 15) darkPixelCount++;
            if (red > this.maxIntensity) saturationCount++;
            
            // Relajar criterio de dominancia del rojo
            const redDominance = red / ((green + blue) / 2);
            if (redDominance >= 1.2 && red >= 15) {
              redSum += red;
              irSum += (green + blue) / 2;
              pixelCount++;
            }
          }
        }
      }

      const totalPixels = 4 * regionSize * regionSize;
      const validPixelsRatio = pixelCount / totalPixels;
      const redDominanceRatio = validRedPixels / totalPixels;

      // Log más frecuente para debugging
      if (this.frameCount % 10 === 0) {
        console.log('Análisis de señal:', {
          frameCount: this.frameCount,
          validPixelsRatio,
          redDominanceRatio,
          maxRedIntensity,
          minRedIntensity,
          darkPixelCount,
          saturationCount,
          pixelCount,
          avgRed: pixelCount > 0 ? redSum / pixelCount : 0
        });
      }
      
      // Relajar criterios de detección
      if (validPixelsRatio < 0.1 || redDominanceRatio < 0.05) {
        console.log('Dedo no detectado:', {
          validPixelsRatio,
          redDominanceRatio,
          minRequired: 0.1
        });
        return {
          red: 0,
          ir: 0,
          quality: 0,
          perfusionIndex: 0
        };
      }

      const avgRed = redSum / pixelCount;
      const avgIr = irSum / pixelCount;
      
      const quality = Math.max(0, Math.min(1, 
        validPixelsRatio >= 0.1 ? 
        1 - ((saturationCount + darkPixelCount) / totalPixels) : 0
      ));
      
      const perfusionIndex = avgRed > 0 ? 
        ((maxRedIntensity - minRedIntensity) / avgRed) * 100 : 0;

      if (quality > this.qualityThreshold && avgRed >= 15) {
        this.lastRed = avgRed;
        this.lastIr = avgIr;
        
        if (this.frameCount % 10 === 0) {
          console.log('Señal válida detectada:', {
            quality,
            perfusionIndex,
            avgRed,
            avgIr
          });
        }
      }
      
      return {
        red: avgRed,
        ir: avgIr,
        quality,
        perfusionIndex
      };
    } catch (error) {
      console.error('Error en extracción de señal:', error);
      return {
        red: this.lastRed,
        ir: this.lastIr,
        quality: 0,
        perfusionIndex: 0
      };
    }
  }
}
