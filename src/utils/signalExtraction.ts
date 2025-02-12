
export class SignalExtractor {
  private readonly minRedIntensity = 30;  // Reducido aún más
  private readonly maxRedIntensity = 255; // Máximo posible
  private readonly minValidPixels = 200;  // Reducido significativamente
  private readonly redDominanceThreshold = 1.1; // Casi cualquier dominancia del rojo
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
    const regionSize = Math.floor(Math.min(width, height) * 0.3); // Aumentado el área de detección

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
        
        // Cálculo simplificado de dominancia del rojo
        const redDominance = (red / (Math.max(green, blue) + 1));
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        // Verificación más permisiva de píxel de piel
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
    
    // Detección mucho más sensible del dedo
    const fingerPresent = coverage > 0.05 && // Reducido a solo 5% de cobertura
                         validPixelCount >= this.minValidPixels;

    // Logging más frecuente
    if (this.frameCount % 10 === 0) { // Cada 10 frames
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
        proporcionRV: (redMean / (greenMean + 1)).toFixed(2),
        proporcionRA: (redMean / (blueMean + 1)).toFixed(2),
        hayDedo: fingerPresent,
        umbralCobertura: '5%',
        umbralDominancia: this.redDominanceThreshold,
        tamanoRegion: regionSize,
        areaTotal: totalPixelsInRegion
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
