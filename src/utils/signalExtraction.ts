
export class SignalExtractor {
  // ¡CONFIGURACIÓN FINAL DE DETECCIÓN DE DEDO - NO MODIFICAR SIN AUTORIZACIÓN!
  // Valores optimizados y validados para máxima sensibilidad manteniendo robustez
  private readonly minRedIntensity = 120;  // Reducido para mayor sensibilidad
  private readonly maxRedIntensity = 255;
  private readonly minValidPixels = 850;   // Reducido para mejor detección
  private readonly redDominanceThreshold = 1.2;  // Ajustado según investigación
  private readonly pixelStep = 1; // Reducido para mayor precisión
  
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
    const regionSize = Math.floor(Math.min(width, height) * 0.35); // Aumentado área de detección

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    const totalPixelsInRegion = Math.pow(regionSize * 2, 2);

    // Análisis mejorado de píxeles con mejor muestreo
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        // Mejorado el cálculo de dominancia del rojo
        const redDominance = (red / Math.max(green, blue));
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        // Validación mejorada del píxel
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
    
    // Mejorada la detección del dedo con múltiples factores
    const perfusionIndex = redMean / Math.max(greenMean, blueMean);
    const fingerPresent = validPixelCount >= this.minValidPixels && 
                         redMean >= this.minRedIntensity &&
                         perfusionIndex >= 1.1;

    // Log detallado para diagnóstico
    console.log('Análisis de señal PPG:', {
      estado: fingerPresent ? 'DEDO PRESENTE' : 'NO HAY DEDO',
      redMean: Math.round(redMean),
      pixelesValidos: validPixelCount,
      cobertura: Math.round(coverage * 100) + '%',
      perfusion: perfusionIndex.toFixed(2),
      dominanciaRojo: maxRedDominance.toFixed(2)
    });

    return {
      red: redMean,
      ir: (greenMean + blueMean) / 2, // Mejorado el cálculo IR
      quality: coverage * (perfusionIndex / 2), // Mejorado el cálculo de calidad
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
