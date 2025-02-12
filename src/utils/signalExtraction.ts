
export class SignalExtractor {
  // Umbrales ajustados basados en investigación de PPG
  private readonly minRedIntensity = 120;  // Reducido para mayor sensibilidad
  private readonly maxRedIntensity = 255;
  private readonly minValidPixels = 100;   // Reducido significativamente
  private readonly redDominanceThreshold = 1.2;  // Reducido para mayor sensibilidad
  private readonly pixelStep = 4; // Aumentado para reducir la cantidad de píxeles procesados
  private readonly ROI_SCALE = 0.2; // 20% del centro de la imagen
  
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
    const regionSize = Math.floor(Math.min(width, height) * this.ROI_SCALE);

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    let sampledPixels = 0;

    // Análisis de ROI (Region of Interest) central
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        sampledPixels++;
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        const redDominance = red / (Math.max(green, blue) + 1);
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        if (red >= this.minRedIntensity && 
            red <= this.maxRedIntensity && 
            redDominance >= this.redDominanceThreshold) {
          validPixelCount++;
          totalRedValue += red;
          totalGreenValue += green;
          totalBlueValue += blue;
        }
      }
    }

    const coverage = validPixelCount / sampledPixels;
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    
    // Detección de dedo más precisa
    const fingerPresent = validPixelCount >= this.minValidPixels && 
                         coverage >= 0.1 && // Al menos 10% de cobertura
                         redMean >= this.minRedIntensity;

    // Log detallado para debugging
    console.log('Detección de dedo:', {
      estado: fingerPresent ? 'DEDO PRESENTE' : 'NO HAY DEDO',
      redMean: Math.round(redMean),
      pixelesValidos: validPixelCount,
      pixelesMuestreados: sampledPixels,
      cobertura: Math.round(coverage * 100) + '%',
      redDominance: maxRedDominance.toFixed(2)
    });

    return {
      red: redMean,
      ir: totalGreenValue / (validPixelCount || 1), // Usar canal verde como IR
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
