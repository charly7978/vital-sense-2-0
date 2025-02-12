
export class SignalExtractor {
  // IMPORTANTE: NO MODIFICAR ESTOS VALORES - Son críticos para la detección del dedo
  // Valores probados y verificados para la detección correcta
  private readonly minRedIntensity = 140; // Umbral mínimo para detección de dedo
  private readonly maxRedIntensity = 255;
  private readonly minValidPixels = 950; // Cantidad mínima de píxeles para considerar dedo presente
  private readonly redDominanceThreshold = 1.4; // Ratio R/(G|B) para confirmar que es sangre
  private readonly pixelStep = 2; // Paso de muestreo para balance rendimiento/precisión
  
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
      rawRedValues: number[];
      timestamp: number;
    };
  } {
    const { width, height, data } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.3); // Región óptima probada

    let validPixelCount = 0;
    let totalRedValue = 0;
    let maxRedDominance = 0;
    let totalGreenValue = 0;
    let totalBlueValue = 0;
    const rawRedValues: number[] = [];
    const totalPixelsInRegion = Math.pow(regionSize * 2, 2);

    // Análisis detallado de píxeles
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        const redDominance = red / (Math.max(green, blue) + 1);
        maxRedDominance = Math.max(maxRedDominance, redDominance);

        // NO MODIFICAR: Criterios validados para detección de sangre en PPG
        if (red >= this.minRedIntensity && red <= this.maxRedIntensity && redDominance >= this.redDominanceThreshold) {
          validPixelCount++;
          totalRedValue += red;
          totalGreenValue += green;
          totalBlueValue += blue;
          rawRedValues.push(red);
        }
      }
    }

    const coverage = validPixelCount / (totalPixelsInRegion / (this.pixelStep * this.pixelStep));
    const redMean = validPixelCount > 0 ? totalRedValue / validPixelCount : 0;
    const fingerPresent = validPixelCount >= this.minValidPixels && redMean >= this.minRedIntensity;

    // Log detallado para diagnóstico
    console.log('Procesamiento de imagen:', {
      timestamp: Date.now(),
      dimensiones: `${width}x${height}`,
      regionAnalizada: `${regionSize * 2}x${regionSize * 2}`,
      pixelesValidos: validPixelCount,
      cobertura: (coverage * 100).toFixed(1) + '%',
      promedioRojo: redMean.toFixed(1),
      dominanciaRoja: maxRedDominance.toFixed(2),
      estadoDedo: fingerPresent ? 'PRESENTE' : 'NO DETECTADO',
      distribucionRojo: rawRedValues.length > 0 ? {
        min: Math.min(...rawRedValues).toFixed(1),
        max: Math.max(...rawRedValues).toFixed(1),
        variacion: (Math.max(...rawRedValues) - Math.min(...rawRedValues)).toFixed(1)
      } : 'Sin datos',
      // Valores de referencia para debugging
      umbralRojo: this.minRedIntensity,
      umbralDominancia: this.redDominanceThreshold,
      umbralPixeles: this.minValidPixels
    });

    return {
      red: redMean,
      ir: redMean * 0.4,
      quality: coverage,
      perfusionIndex: maxRedDominance,
      fingerPresent,
      diagnostics: {
        redMean,
        validPixels: validPixelCount,
        redDominance: maxRedDominance,
        coverage,
        rawRedValues,
        timestamp: Date.now()
      }
    };
  }
}
