
interface ExtractedSignals {
  red: number;
  ir: number;
  quality: number;
  perfusionIndex: number;
}

export class SignalExtractor {
  private readonly qualityThreshold = 0.6;
  private readonly minIntensity = 30;
  private readonly maxIntensity = 250;

  extractChannels(imageData: ImageData): ExtractedSignals {
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
    const regionSize = 50;
    
    for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
      for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (y * width + x) * 4;
          const red = imageData.data[i];
          const green = imageData.data[i+1];
          const blue = imageData.data[i+2];
          
          // Track min/max intensities for perfusion index
          maxRedIntensity = Math.max(maxRedIntensity, red);
          minRedIntensity = Math.min(minRedIntensity, red);
          
          if (red < this.minIntensity) darkPixelCount++;
          if (red > this.maxIntensity) saturationCount++;
          
          redSum += red;
          // Mejorar la separación de longitudes de onda IR
          irSum += (green * 0.8 + blue * 0.2); // Ajuste de pesos para mejor separación espectral
          pixelCount++;
        }
      }
    }
    
    const quality = 1 - ((saturationCount + darkPixelCount) / pixelCount);
    const avgRed = pixelCount > 0 ? redSum / pixelCount : 0;
    const avgIr = pixelCount > 0 ? irSum / pixelCount : 0;
    
    // Calcular índice de perfusión (PI = AC/DC * 100)
    const perfusionIndex = avgRed > 0 ? 
      ((maxRedIntensity - minRedIntensity) / avgRed) * 100 : 0;
    
    return {
      red: avgRed,
      ir: avgIr,
      quality,
      perfusionIndex
    };
  }
}
