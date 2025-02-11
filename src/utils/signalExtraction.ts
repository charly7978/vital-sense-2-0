
import { SignalProcessor } from './signalProcessing';

interface ExtractedSignals {
  red: number;
  ir: number;
  quality: number;
}

export class SignalExtractor {
  private readonly qualityThreshold = 0.6;

  extractChannels(imageData: ImageData): ExtractedSignals {
    let redSum = 0;
    let irSum = 0;
    let pixelCount = 0;
    let saturationCount = 0;
    let darkPixelCount = 0;
    
    const width = imageData.width;
    const height = imageData.height;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = 50;
    
    for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
      for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (y * width + x) * 4;
          const red = imageData.data[i];
          const green = imageData.data[i+1];
          const blue = imageData.data[i+2];
          
          if (red < 30) darkPixelCount++;
          if (red > 250) saturationCount++;
          
          redSum += red;
          irSum += (green * 0.7 + blue * 0.3);
          pixelCount++;
        }
      }
    }
    
    const quality = 1 - ((saturationCount + darkPixelCount) / pixelCount);
    
    return {
      red: pixelCount > 0 ? redSum / pixelCount : 0,
      ir: pixelCount > 0 ? irSum / pixelCount : 0,
      quality
    };
  }
}
