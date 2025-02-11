
import { ProcessingSettings } from './types';

interface ExtractedSignals {
  red: number;
  ir: number;
  quality: number;
  perfusionIndex: number;
}

export class SignalExtractor {
  private readonly qualityThreshold = 0.3; // Increased from 0.2
  private readonly minIntensity = 30; // Increased from 15
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
    minRedValue: 30, // Increased from 20
    minRedDominance: 1.8, // Increased from 1.5
    minValidPixelsRatio: 0.35, // Increased from 0.3
    minBrightness: 35, // Increased from 30
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
      const regionSize = Math.min(80, Math.floor(Math.min(width, height) / 2)); // Reduced from 100
      
      // Analizar región central más pequeña
      for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
        for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const i = (y * width + x) * 4;
            const red = imageData.data[i];
            const green = imageData.data[i+1];
            const blue = imageData.data[i+2];
            
            if (red > this.minIntensity) {
              validRedPixels++;
            }
            
            maxRedIntensity = Math.max(maxRedIntensity, red);
            minRedIntensity = Math.min(minRedIntensity, red);
            
            if (red < this.minIntensity) darkPixelCount++;
            if (red > this.maxIntensity) saturationCount++;
            
            // Criterio más estricto para dominancia del rojo
            const redDominance = red / ((green + blue) / 2);
            if (redDominance >= 1.8 && red >= this.minIntensity) {
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

      if (this.frameCount % 10 === 0) {
        console.log('Análisis de señal detallado:', {
          frameCount: this.frameCount,
          validPixelsRatio,
          redDominanceRatio,
          maxRedIntensity,
          minRedIntensity,
          darkPixelCount,
          saturationCount,
          pixelCount,
          avgRed: pixelCount > 0 ? redSum / pixelCount : 0,
          regionSize,
          thresholds: {
            minIntensity: this.minIntensity,
            qualityThreshold: this.qualityThreshold,
            minRedDominance: 1.8
          }
        });
      }
      
      // Criterios más estrictos para detección de dedo
      if (validPixelsRatio < 0.35 || redDominanceRatio < 0.3) {
        console.log('Dedo no detectado - criterios no cumplidos:', {
          validPixelsRatio,
          redDominanceRatio,
          minRequired: 0.35
        });
        return {
          red: 0,
          ir: 0,
          quality: 0,
          perfusionIndex: 0
        };
      }

      const avgRed = pixelCount > 0 ? redSum / pixelCount : 0;
      const avgIr = pixelCount > 0 ? irSum / pixelCount : 0;
      
      // Calidad basada en múltiples factores
      const quality = Math.max(0, Math.min(1, 
        validPixelsRatio >= 0.35 ? 
        (1 - ((saturationCount + darkPixelCount) / totalPixels)) * 
        (avgRed > this.minIntensity ? 1 : 0.5) * 
        (redDominanceRatio >= 0.3 ? 1 : 0.5) : 0
      ));
      
      const perfusionIndex = avgRed > 0 ? 
        ((maxRedIntensity - minRedIntensity) / avgRed) * 100 : 0;

      if (quality > this.qualityThreshold && avgRed >= this.minIntensity) {
        this.lastRed = avgRed;
        this.lastIr = avgIr;
        
        if (this.frameCount % 10 === 0) {
          console.log('Señal válida detectada:', {
            quality,
            perfusionIndex,
            avgRed,
            avgIr,
            redDominance: avgRed / avgIr
          });
        }
      } else if (this.frameCount % 10 === 0) {
        console.log('No se detecta dedo o señal de baja calidad', {
          red: avgRed,
          quality
        });
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
