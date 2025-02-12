
export class SignalExtractor {
  private readonly minRedIntensity = 150;  // Aumentado aún más - necesitamos estar seguros de la presencia del dedo
  private readonly maxRedIntensity = 255;
  private readonly minValidPixels = 3000;  // Área mínima más grande para evitar falsos positivos
  private readonly redDominanceThreshold = 1.8; // Mayor dominancia del rojo requerida
  private readonly pixelStep = 1; 
  private readonly minRedGreenRatio = 2.0; // Mucho más exigente con la proporción rojo/verde
  private readonly minRedBlueRatio = 2.0;  // Mucho más exigente con la proporción rojo/azul
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
    const regionSize = Math.floor(Math.min(width, height) * 0.2); // Área aún más concentrada

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

    // Análisis píxel por píxel
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      let rowValidPixels = 0;
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        const redGreenRatio = red / (green + 1);
        const redBlueRatio = red / (blue + 1);
        const redDominance = red / (Math.max(green, blue) + 1);
        
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        // Verificación mucho más estricta
        if (red >= this.minRedIntensity && 
            red <= this.maxRedIntensity && 
            redDominance >= this.redDominanceThreshold &&
            redGreenRatio >= this.minRedGreenRatio &&
            redBlueRatio >= this.minRedBlueRatio &&
            red > green * 2 && // El rojo debe ser al menos el doble que el verde
            red > blue * 2     // El rojo debe ser al menos el doble que el azul
        ) {
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
      
      // Verificación más estricta de la coherencia espacial
      if (rowValidPixels < regionSize * 0.4) { // Aumentado a 40% de la fila
        validPixelCount -= rowValidPixels;
      }
    }

    const coverage = validPixelCount / (totalPixelsInRegion / (this.pixelStep * this.pixelStep));
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    const greenMean = validPixelCount > 0 ? totalGreenValue / validPixelCount : 0;
    const blueMean = validPixelCount > 0 ? totalBlueValue / validPixelCount : 0;
    
    const ratioQuality = Math.min(
      validRedGreenRatios / Math.max(validPixelCount, 1),
      validRedBlueRatios / Math.max(validPixelCount, 1)
    );
    
    // Detección mucho más estricta
    const fingerPresent = coverage > 0.35 && // Aumentado a 35% del área
                         validPixelCount >= this.minValidPixels &&
                         ratioQuality > 0.9 && // 90% de píxeles deben cumplir los ratios
                         maxConsecutiveValidPixels > regionSize * 0.6; // Mayor continuidad requerida

    // Logging más específico
    console.log('Análisis de frame:', {
      frameNum: this.frameCount,
      cobertura: {
        pixelesValidos: validPixelCount,
        pixelesConsecutivos: maxConsecutiveValidPixels,
        porcentajeCobertura: (coverage * 100).toFixed(1) + '%',
        minimoRequerido: '35%'
      },
      intensidades: {
        promedioRojo: redMean.toFixed(1),
        promedioVerde: greenMean.toFixed(1),
        promedioAzul: blueMean.toFixed(1),
        minimoRojo: this.minRedIntensity,
        ratioRojoVerde: (redMean / (greenMean + 1)).toFixed(2),
        ratioRojoAzul: (redMean / (blueMean + 1)).toFixed(2)
      },
      ratios: {
        calidadRatios: (ratioQuality * 100).toFixed(1) + '%',
        dominanciaRojo: maxRedDominance.toFixed(2)
      },
      deteccion: {
        dedoDetectado: fingerPresent,
        razonDeteccion: fingerPresent ? 'Cumple todos los criterios' : 'No cumple criterios mínimos'
      }
    });

    return {
      red: redMean,
      ir: redMean * 0.4, // Reducido para mayor precisión
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
