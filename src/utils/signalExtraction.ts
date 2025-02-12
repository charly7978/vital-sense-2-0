
export class SignalExtractor {
  private readonly minRedIntensity = 40;  // Reducido para mejor detección
  private readonly maxRedIntensity = 250; // Aumentado el rango superior
  private readonly minValidPixels = 400;  // Reducido para ser más sensible
  private readonly redDominanceThreshold = 1.2; // Reducido para mejor detección
  private readonly pixelStep = 2;
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
    const regionSize = Math.floor(Math.min(width, height) * 0.25);

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    const totalPixelsInRegion = Math.pow(regionSize * 2, 2);

    // Análisis más detallado de la imagen
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        // Cálculo mejorado de dominancia del rojo
        const redOverGreen = red / (green + 1);
        const redOverBlue = red / (blue + 1);
        const redDominance = Math.min(redOverGreen, redOverBlue);
        
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        // Verificación más sensible de píxel de piel
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

    // Cálculos más detallados
    const coverage = validPixelCount / (totalPixelsInRegion / (this.pixelStep * this.pixelStep));
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    const greenMean = validPixelCount > 0 ? totalGreenValue / validPixelCount : 0;
    const blueMean = validPixelCount > 0 ? totalBlueValue / validPixelCount : 0;
    
    // Detección más sensible del dedo
    const fingerPresent = coverage > 0.15 && // Reducido a 15% para más sensibilidad
                         validPixelCount >= this.minValidPixels && 
                         redMean >= this.minRedIntensity;

    // Logging más frecuente y detallado
    if (this.frameCount % 15 === 0) { // Aumentada la frecuencia de logging
      console.log('Diagnóstico detallado de detección de dedo:', {
        cobertura: coverage.toFixed(3),
        porcentajeCobertura: (coverage * 100).toFixed(1) + '%',
        pixelesValidos: validPixelCount,
        minimoRequerido: this.minValidPixels,
        promedioRojo: redMean.toFixed(1),
        promedioVerde: greenMean.toFixed(1),
        promedioAzul: blueMean.toFixed(1),
        minimoRojo: this.minRedIntensity,
        dominanciaRojo: maxRedDominance.toFixed(2),
        proporcionRV: (redMean / greenMean).toFixed(2),
        proporcionRA: (redMean / blueMean).toFixed(2),
        hayDedo: fingerPresent,
        umbralCobertura: '15%',
        umbralDominancia: this.redDominanceThreshold
      });
    }

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
