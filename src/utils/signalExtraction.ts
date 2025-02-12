
export class SignalExtractor {
  // ¡CONFIGURACIÓN MÁXIMA SENSIBILIDAD - AJUSTADA PARA DETECCIÓN AGRESIVA!
  private readonly minRedIntensity = 80;   // Reducido drásticamente de 120
  private readonly maxRedIntensity = 255;
  private readonly minValidPixels = 400;   // Reducido drásticamente de 850
  private readonly redDominanceThreshold = 1.05;  // Reducido de 1.2
  private readonly pixelStep = 1;
  
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
    const regionSize = Math.floor(Math.min(width, height) * 0.45); // Aumentado de 0.35

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    const totalPixelsInRegion = Math.pow(regionSize * 2, 2);

    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        const redDominance = (red / Math.max(green, blue, 1));
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        // Validación mucho más permisiva
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

    const coverage = validPixelCount / (totalPixelsInRegion / (this.pixelStep * this.pixelStep));
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    const greenMean = validPixelCount > 0 ? totalGreenValue / validPixelCount : 0;
    const blueMean = validPixelCount > 0 ? totalBlueValue / validPixelCount : 0;
    
    // Detección más permisiva
    const perfusionIndex = redMean / Math.max(greenMean, blueMean, 1);
    const fingerPresent = validPixelCount >= this.minValidPixels && 
                         redMean >= this.minRedIntensity &&
                         perfusionIndex >= 1.02; // Reducido de 1.1

    console.log('Análisis de señal PPG:', {
      estado: fingerPresent ? 'DEDO PRESENTE' : 'NO HAY DEDO',
      redMean: Math.round(redMean),
      pixelesValidos: validPixelCount,
      cobertura: Math.round(coverage * 100) + '%',
      perfusion: perfusionIndex.toFixed(2),
      dominanciaRojo: maxRedDominance.toFixed(2)
    });

    return {
      red: redMean * 1.5, // Amplificación adicional
      ir: (greenMean + blueMean) / 2,
      quality: Math.min(1, coverage * perfusionIndex * 2), // Aumentado factor de calidad
      perfusionIndex,
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
