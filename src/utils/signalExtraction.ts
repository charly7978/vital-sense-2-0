
export class SignalExtractor {
  private readonly minRedIntensity = 20;  // Reducido drásticamente
  private readonly maxRedIntensity = 255; // Máximo posible
  private readonly minValidPixels = 100;  // Reducido drásticamente
  private readonly redDominanceThreshold = 1.05; // Mínima dominancia requerida
  private readonly pixelStep = 1; // Analizamos cada pixel
  private frameCount = 0;

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
    this.frameCount++;
    const { width, height, data } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.4); // Área más grande

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    const totalPixelsInRegion = Math.pow(regionSize * 2, 2);

    // Análisis de la imagen
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        // Cualquier píxel con más rojo que los otros canales
        const redDominance = (red / (Math.max(green, blue) + 1));
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        // Verificación extremadamente permisiva
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

    // Cálculos
    const coverage = validPixelCount / (totalPixelsInRegion / (this.pixelStep * this.pixelStep));
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    const greenMean = validPixelCount > 0 ? totalGreenValue / validPixelCount : 0;
    const blueMean = validPixelCount > 0 ? totalBlueValue / validPixelCount : 0;
    
    // Detección extremadamente sensible
    const fingerPresent = coverage > 0.02 && // Solo 2% de cobertura requerida
                         validPixelCount >= this.minValidPixels;

    // Logging en cada frame
    console.log('Análisis de frame:', {
      width,
      height,
      regionSize,
      centerX,
      centerY,
      totalPixelsInRegion,
      validPixelCount,
      coverage: coverage.toFixed(3),
      porcentajeCobertura: (coverage * 100).toFixed(1) + '%',
      promedioRojo: redMean.toFixed(1),
      promedioVerde: greenMean.toFixed(1),
      promedioAzul: blueMean.toFixed(1),
      dominanciaRojo: maxRedDominance.toFixed(2),
      hayDedo: fingerPresent,
      umbralCobertura: '2%',
      umbralDominancia: this.redDominanceThreshold,
      pixelPasoCada: this.pixelStep,
      minimoPixelesValidos: this.minValidPixels,
      minimoIntensidadRoja: this.minRedIntensity
    });

    return {
      red: redMean,
      ir: redMean * 0.5,
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
