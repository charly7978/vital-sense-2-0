
export class SignalExtractor {
  private readonly minRedIntensity = 150;  // Mantenemos este umbral
  private readonly maxRedIntensity = 255;
  private readonly minValidPixels = 1000;  // Mantenemos este umbral
  private readonly redDominanceThreshold = 1.5;  // Ajustamos de 1.5 a 1.4 (muy sutil)
  private readonly pixelStep = 2;
  
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
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.3);

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    const totalPixelsInRegion = Math.pow(regionSize * 2, 2);

    // Análisis simplificado de píxeles
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        const redDominance = red / (Math.max(green, blue) + 1);
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        // Simplificamos la validación del píxel
        if (red >= this.minRedIntensity && red <= this.maxRedIntensity && redDominance >= this.redDominanceThreshold) {
          validPixelCount++;
          totalRedValue += red;
          totalGreenValue += green;
          totalBlueValue += blue;
        }
      }
    }

    const coverage = validPixelCount / (totalPixelsInRegion / (this.pixelStep * this.pixelStep));
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    
    // Simplificamos la detección del dedo
    const fingerPresent = validPixelCount >= this.minValidPixels && redMean >= this.minRedIntensity;

    // Log más claro
    console.log('Detección de dedo:', {
      estado: fingerPresent ? 'DEDO PRESENTE' : 'NO HAY DEDO',
      redMean: Math.round(redMean),
      pixelesValidos: validPixelCount,
      cobertura: Math.round(coverage * 100) + '%'
    });

    return {
      red: redMean,
      ir: redMean * 0.4,
      quality: coverage,
      perfusionIndex: maxRedDominance,
      fingerPresent,
      diagnostics: {
        redMean,
        validPixels: validPixelCount,
        redDominance: maxRedDominance,
        coverage
      }
    };
  }
}
