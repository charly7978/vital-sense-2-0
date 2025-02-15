
export class SignalExtractor {
  private readonly ROI_SIZE = 128; // Aumentado para mejor cobertura
  private readonly MIN_RED_VALUE = 50;
  private readonly MAX_RED_VALUE = 250;
  private readonly MIN_VALID_PIXELS = 0.2; // Reducido para mejor sensibilidad
  private readonly BUFFER_SIZE = 30;
  private signalBuffer: number[] = [];
  private lastProcessingTime = 0;
  private readonly MIN_PROCESSING_INTERVAL = 33;

  extractSignal(imageData: ImageData): {
    red: number;
    ir: number;
    quality: number;
    fingerPresent: boolean;
  } {
    const now = Date.now();
    if (now - this.lastProcessingTime < this.MIN_PROCESSING_INTERVAL) {
      return { red: 0, ir: 0, quality: 0, fingerPresent: false };
    }
    this.lastProcessingTime = now;

    const { width, height, data } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const halfROI = Math.floor(this.ROI_SIZE / 2);

    let redSum = 0;
    let irSum = 0;
    let validPixels = 0;
    let totalPixels = 0;
    const redValues: number[] = [];

    // Análisis detallado de ROI
    for (let y = centerY - halfROI; y < centerY + halfROI; y++) {
      for (let x = centerX - halfROI; x < centerX + halfROI; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          totalPixels++;
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          
          // Criterios mejorados para píxeles válidos
          const isSkin = r > g && r > b && r > this.MIN_RED_VALUE && r < this.MAX_RED_VALUE;
          
          if (isSkin) {
            redSum += r;
            irSum += g;
            redValues.push(r);
            validPixels++;
          }
        }
      }
    }

    const validPixelsRatio = validPixels / totalPixels;
    const avgRed = validPixels > 0 ? redSum / validPixels : 0;
    const avgIR = validPixels > 0 ? irSum / validPixels : 0;

    // Log detallado
    console.log('📸 Análisis de frame:', {
      totalPixeles: totalPixels,
      pixelesValidos: validPixels,
      ratio: validPixelsRatio,
      promedioRojo: avgRed,
      promedioIR: avgIR,
      minRojo: Math.min(...redValues),
      maxRojo: Math.max(...redValues)
    });

    // Actualizar buffer
    if (avgRed > 0) {
      this.signalBuffer.push(avgRed);
      if (this.signalBuffer.length > this.BUFFER_SIZE) {
        this.signalBuffer.shift();
      }
    }

    // Calcular calidad de señal mejorada
    const quality = this.calculateSignalQuality(redValues, validPixelsRatio);
    const fingerPresent = quality > 0.3;

    // Log de estado final
    console.log('🔍 Estado de señal:', {
      calidadSeñal: quality,
      dedoDetectado: fingerPresent,
      pixelesValidos: validPixelsRatio * 100 + '%'
    });

    return {
      red: fingerPresent ? avgRed : 0,
      ir: fingerPresent ? avgIR : 0,
      quality,
      fingerPresent
    };
  }

  private calculateSignalQuality(redValues: number[], validPixelsRatio: number): number {
    if (redValues.length === 0 || validPixelsRatio < this.MIN_VALID_PIXELS) {
      console.log('❌ Señal insuficiente:', {
        valoresRojos: redValues.length,
        ratioPixeles: validPixelsRatio,
        umbralMinimo: this.MIN_VALID_PIXELS
      });
      return 0;
    }

    // Análisis estadístico mejorado
    redValues.sort((a, b) => a - b);
    const q1 = redValues[Math.floor(redValues.length * 0.25)];
    const q3 = redValues[Math.floor(redValues.length * 0.75)];
    const iqr = q3 - q1;
    const median = redValues[Math.floor(redValues.length * 0.5)];
    const mean = redValues.reduce((a, b) => a + b, 0) / redValues.length;
    const stdDev = Math.sqrt(
      redValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / redValues.length
    );

    // Factores de calidad mejorados
    const intensityQuality = Math.min(1, Math.max(0, (median - this.MIN_RED_VALUE) / 150));
    const distributionQuality = Math.max(0, 1 - (stdDev / mean) * 2);
    const coverageQuality = Math.min(1, validPixelsRatio / this.MIN_VALID_PIXELS);
    const stabilityQuality = Math.max(0, 1 - iqr / (q3 - q1));

    const quality = (
      intensityQuality * 0.3 +
      distributionQuality * 0.3 +
      coverageQuality * 0.2 +
      stabilityQuality * 0.2
    );

    console.log('📊 Análisis de calidad:', {
      intensidad: intensityQuality,
      distribucion: distributionQuality,
      cobertura: coverageQuality,
      estabilidad: stabilityQuality,
      calidadFinal: quality,
      estadisticas: {
        mediana: median,
        media: mean,
        desviacionEstandar: stdDev,
        iqr: iqr
      }
    });

    return quality;
  }
}
