
export class SignalExtractor {
  private readonly minRedIntensity = 50;  // Aumentado basado en papers de PPG
  private readonly maxRedIntensity = 255;
  private readonly minValidPixels = 500;  // Aumentado significativamente
  private readonly redDominanceThreshold = 1.3; // Valor más estricto basado en literatura
  private readonly pixelStep = 2; // Analizamos cada 2 píxeles para mejor rendimiento
  private readonly minRedGreenRatio = 1.5; // Nueva métrica basada en estudios PPG
  private readonly minRedBlueRatio = 1.5;  // Nueva métrica basada en estudios PPG
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
    const regionSize = Math.floor(Math.min(width, height) * 0.3); // Área más concentrada

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    let validRedGreenRatios = 0;
    let validRedBlueRatios = 0;
    const totalPixelsInRegion = Math.pow(regionSize * 2, 2);

    // Análisis mejorado de la imagen
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        // Cálculo mejorado de ratios
        const redGreenRatio = red / (green + 1);
        const redBlueRatio = red / (blue + 1);
        const redDominance = red / (Math.max(green, blue) + 1);
        
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        // Verificación más estricta con múltiples condiciones
        if (red >= this.minRedIntensity && 
            red <= this.maxRedIntensity && 
            redDominance >= this.redDominanceThreshold &&
            redGreenRatio >= this.minRedGreenRatio &&
            redBlueRatio >= this.minRedBlueRatio) {
          
          validPixelCount++;
          totalRedValue += red;
          totalGreenValue += green;
          totalBlueValue += blue;

          if (redGreenRatio >= this.minRedGreenRatio) validRedGreenRatios++;
          if (redBlueRatio >= this.minRedBlueRatio) validRedBlueRatios++;
        }
      }
    }

    // Cálculos mejorados
    const coverage = validPixelCount / (totalPixelsInRegion / (this.pixelStep * this.pixelStep));
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    const greenMean = validPixelCount > 0 ? totalGreenValue / validPixelCount : 0;
    const blueMean = validPixelCount > 0 ? totalBlueValue / validPixelCount : 0;
    
    // Detección más robusta con múltiples factores
    const ratioQuality = Math.min(
      validRedGreenRatios / validPixelCount,
      validRedBlueRatios / validPixelCount
    );
    
    const fingerPresent = coverage > 0.15 && // Aumentado a 15%
                         validPixelCount >= this.minValidPixels &&
                         ratioQuality > 0.8; // Al menos 80% de píxeles válidos deben cumplir los ratios

    // Logging detallado
    console.log('Análisis detallado de frame:', {
      frameNum: this.frameCount,
      cobertura: {
        pixelesValidos: validPixelCount,
        porcentajeCobertura: (coverage * 100).toFixed(1) + '%',
        porcentajeRequerido: '15%'
      },
      intensidades: {
        promedioRojo: redMean.toFixed(1),
        promedioVerde: greenMean.toFixed(1),
        promedioAzul: blueMean.toFixed(1)
      },
      ratios: {
        calidadRatios: (ratioQuality * 100).toFixed(1) + '%',
        dominanciaRojo: maxRedDominance.toFixed(2),
        umbralDominancia: this.redDominanceThreshold
      },
      deteccion: {
        dedoDetectado: fingerPresent,
        minimoPixelesValidos: this.minValidPixels,
        minimoIntensidadRoja: this.minRedIntensity
      }
    });

    return {
      red: redMean,
      ir: redMean * 0.6, // Ajustado basado en estudios PPG
      quality: coverage * ratioQuality, // Calidad ponderada
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
