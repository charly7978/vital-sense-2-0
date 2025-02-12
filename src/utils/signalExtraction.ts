
export class SignalExtractor {
  private readonly minRedIntensity = 120;  // Aumentado significativamente - un dedo real bloquea mucha luz
  private readonly maxRedIntensity = 255;
  private readonly minValidPixels = 2000;  // Área mínima real de un dedo
  private readonly redDominanceThreshold = 1.5; // El rojo debe ser claramente dominante
  private readonly pixelStep = 1; // Analizar cada pixel para mayor precisión
  private readonly minRedGreenRatio = 1.8; // El rojo debe ser mucho más fuerte que el verde
  private readonly minRedBlueRatio = 1.8;  // El rojo debe ser mucho más fuerte que el azul
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
    const regionSize = Math.floor(Math.min(width, height) * 0.25); // Área más pequeña y centrada

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    let validRedGreenRatios = 0;
    let validRedBlueRatios = 0;
    let consecutiveValidPixels = 0;
    let maxConsecutiveValidPixels = 0;
    const totalPixelsInRegion = Math.pow(regionSize * 2, 2);

    // Análisis más estricto de la imagen
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      let rowValidPixels = 0;
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        // Cálculos más estrictos de ratios
        const redGreenRatio = red / (green + 1);
        const redBlueRatio = red / (blue + 1);
        const redDominance = red / (Math.max(green, blue) + 1);
        
        // Verificación más estricta de píxel válido
        if (red >= this.minRedIntensity && 
            red <= this.maxRedIntensity && 
            redDominance >= this.redDominanceThreshold &&
            redGreenRatio >= this.minRedGreenRatio &&
            redBlueRatio >= this.minRedBlueRatio) {
          
          rowValidPixels++;
          validPixelCount++;
          totalRedValue += red;
          totalGreenValue += green;
          totalBlueValue += blue;

          if (redGreenRatio >= this.minRedGreenRatio) validRedGreenRatios++;
          if (redBlueRatio >= this.minRedBlueRatio) validRedBlueRatios++;
          
          consecutiveValidPixels++;
          maxConsecutiveValidPixels = Math.max(maxConsecutiveValidPixels, consecutiveValidPixels);
        } else {
          consecutiveValidPixels = 0;
        }
      }
      
      // Verificar coherencia espacial
      if (rowValidPixels < regionSize * 0.3) { // Al menos 30% de la fila debe ser válida
        validPixelCount -= rowValidPixels;
      }
    }

    // Cálculos mejorados
    const coverage = validPixelCount / (totalPixelsInRegion / (this.pixelStep * this.pixelStep));
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    const greenMean = validPixelCount > 0 ? totalGreenValue / validPixelCount : 0;
    const blueMean = validPixelCount > 0 ? totalBlueValue / validPixelCount : 0;
    
    // Verificación más estricta de ratios
    const ratioQuality = Math.min(
      validRedGreenRatios / validPixelCount,
      validRedBlueRatios / validPixelCount
    );
    
    // Detección más estricta con coherencia espacial
    const fingerPresent = coverage > 0.25 && // Debe cubrir al menos 25% del área
                         validPixelCount >= this.minValidPixels &&
                         ratioQuality > 0.85 && // 85% de píxeles deben cumplir los ratios
                         maxConsecutiveValidPixels > regionSize * 0.5; // Debe haber continuidad

    // Logging más detallado
    console.log('Análisis detallado de frame:', {
      frameNum: this.frameCount,
      cobertura: {
        pixelesValidos: validPixelCount,
        pixelesConsecutivos: maxConsecutiveValidPixels,
        porcentajeCobertura: (coverage * 100).toFixed(1) + '%',
        minimoRequerido: '25%'
      },
      intensidades: {
        promedioRojo: redMean.toFixed(1),
        promedioVerde: greenMean.toFixed(1),
        promedioAzul: blueMean.toFixed(1),
        minimoRojo: this.minRedIntensity
      },
      ratios: {
        calidadRatios: (ratioQuality * 100).toFixed(1) + '%',
        dominanciaRojo: maxRedDominance.toFixed(2),
        umbralDominancia: this.redDominanceThreshold,
        ratioRojoVerde: this.minRedGreenRatio,
        ratioRojoAzul: this.minRedBlueRatio
      },
      deteccion: {
        dedoDetectado: fingerPresent,
        minimoPixelesValidos: this.minValidPixels,
        coherenciaEspacial: maxConsecutiveValidPixels > regionSize * 0.5
      }
    });

    return {
      red: redMean,
      ir: redMean * 0.5,
      quality: coverage * ratioQuality * (maxConsecutiveValidPixels / (regionSize * 2)),
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
