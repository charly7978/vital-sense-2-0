
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
    try {
      let redSum = 0;
      let irSum = 0;
      let pixelCount = 0;
      let saturationCount = 0;
      let darkPixelCount = 0;
      let maxRedIntensity = 0;
      let minRedIntensity = 255;
      
      const width = imageData.width;
      const height = imageData.height;
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const regionSize = Math.min(150, Math.floor(Math.min(width, height) / 2));
      
      for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
        for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
          if (x >= 0 && x < width && y >= 0 && y < height) {
            const i = (y * width + x) * 4;
            const red = imageData.data[i];
            const green = imageData.data[i+1];
            const blue = imageData.data[i+2];
            
            maxRedIntensity = Math.max(maxRedIntensity, red);
            minRedIntensity = Math.min(minRedIntensity, red);
            
            if (red < this.processingSettings.minRedValue) darkPixelCount++;
            if (red > this.maxIntensity) saturationCount++;
            
            // Verificar dominancia del canal rojo
            const redDominance = red / ((green + blue) / 2);
            if (redDominance >= this.processingSettings.minRedDominance) {
              redSum += red;
              irSum += (green * 0.8 + blue * 0.2);
              pixelCount++;
            }
          }
        }
      }
      
      if (pixelCount === 0) {
        console.log('No pixels found in region');
        return {
          red: this.lastRed,
          ir: this.lastIr,
          quality: 0,
          perfusionIndex: 0
        };
      }

      const avgRed = redSum / pixelCount;
      const avgIr = irSum / pixelCount;
      const validPixelsRatio = pixelCount / (4 * regionSize * regionSize);
      const quality = Math.max(0, Math.min(1, 
        validPixelsRatio >= this.processingSettings.minValidPixelsRatio ? 
        1 - ((saturationCount + darkPixelCount) / pixelCount) : 0
      ));
      
      const perfusionIndex = avgRed > 0 ? 
        ((maxRedIntensity - minRedIntensity) / avgRed) * 100 : 0;

      // Actualizar últimos valores válidos si la calidad supera el umbral mínimo
      if (quality > this.qualityThreshold && avgRed >= this.processingSettings.minBrightness) {
        this.lastRed = avgRed;
        this.lastIr = avgIr;
      }
      
      return {
        red: avgRed,
        ir: avgIr,
        quality,
        perfusionIndex
      };
    } catch (error) {
      console.error('Error in signal extraction:', error);
      return {
        red: this.lastRed,
        ir: this.lastIr,
        quality: 0,
        perfusionIndex: 0
      };
    }
  }
}
