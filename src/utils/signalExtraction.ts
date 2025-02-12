
export class SignalExtractor {
  private readonly minRedIntensity = 60;  // Mínimo valor de rojo para considerar que hay piel
  private readonly maxRedIntensity = 235; // Máximo valor de rojo (evita saturación)
  private readonly minValidPixels = 800;  // Área mínima que debe cubrir el dedo
  private readonly redDominanceThreshold = 1.35; // Cuánto debe dominar el rojo sobre otros colores
  private readonly pixelStep = 2; // Para optimizar el procesamiento
  private frameCount = 0;

  extractChannels(imageData: ImageData): { 
    red: number; 
    ir: number; 
    quality: number; 
    perfusionIndex: number;
    fingerPresent: boolean; // Nuevo campo específico para detección de dedo
    diagnostics: { // Diagnósticos para debugging
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
    const regionSize = Math.floor(Math.min(width, height) * 0.25); // Región de interés más precisa

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
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
        
        // Calculamos la dominancia del rojo
        const redOverGreen = red / (green + 1);
        const redOverBlue = red / (blue + 1);
        const redDominance = Math.min(redOverGreen, redOverBlue);
        
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        // Verificación natural de píxel de piel
        if (red >= this.minRedIntensity && 
            red <= this.maxRedIntensity && 
            redDominance >= this.redDominanceThreshold) {
          validPixelCount++;
          totalRedValue += red;
        }
      }
    }

    // Cálculos de métricas
    const coverage = validPixelCount / (totalPixelsInRegion / (this.pixelStep * this.pixelStep));
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    
    // Detección natural del dedo
    const fingerPresent = coverage > 0.3 && // Al menos 30% del área debe ser piel
                         validPixelCount >= this.minValidPixels && 
                         redMean >= this.minRedIntensity;

    if (this.frameCount % 30 === 0) {
      console.log('Diagnóstico detección de dedo:', {
        cobertura: coverage,
        pixelesValidos: validPixelCount,
        minimoRequerido: this.minValidPixels,
        promedioRojo: redMean,
        minimoRojo: this.minRedIntensity,
        dominanciaRojo: maxRedDominance,
        hayDedo: fingerPresent
      });
    }

    // Retornamos los valores crudos sin modificarlos basados en la presencia del dedo
    return {
      red: redMean,
      ir: redMean * 0.5, // Simplificado por ahora, mejoraremos esto después
      quality: coverage, // La calidad ahora es independiente de la presencia del dedo
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
