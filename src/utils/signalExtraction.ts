
export class SignalExtractor {
  private readonly minIntensity = 15;
  private readonly maxIntensity = 245;
  private readonly smoothingWindow = 10;
  private lastRedValues: number[] = [];
  private lastIrValues: number[] = [];
  private frameCount = 0;
  private readonly minValidPixels = 100; // Aumentado para mayor confiabilidad
  private readonly redDominanceThreshold = 1.2; // Aumentado para mejor detección
  private readonly stabilityThreshold = 0.1;
  private lastStabilityValues: number[] = [];
  private readonly pixelStep = 2;

  private kalmanState = {
    red: { q: 0.05, r: 1.2, p: 1, x: 0, k: 0 },
    ir: { q: 0.05, r: 1.2, p: 1, x: 0, k: 0 }
  };

  private applyKalmanFilter(measurement: number, state: typeof this.kalmanState.red) {
    state.p = state.p + state.q;
    state.k = state.p / (state.p + state.r);
    state.x = state.x + state.k * (measurement - state.x);
    state.p = (1 - state.k) * state.p;
    return state.x;
  }

  private calculateMean(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateStability(value: number): number {
    this.lastStabilityValues.push(value);
    if (this.lastStabilityValues.length > 15) {
      this.lastStabilityValues.shift();
    }

    if (this.lastStabilityValues.length < 5) return 0;

    const mean = this.calculateMean(this.lastStabilityValues);
    const variance = this.lastStabilityValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.lastStabilityValues.length;
    return Math.max(0.1, 1 - Math.min(1, Math.sqrt(variance) / mean));
  }

  extractChannels(imageData: ImageData): { red: number; ir: number; quality: number; perfusionIndex: number } {
    try {
      this.frameCount++;
      const { width, height, data } = imageData;
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const regionSize = Math.floor(Math.min(width, height) * 0.4);

      const validPixels = {
        red: [] as number[],
        ir: [] as number[],
        count: 0,
        sum: { red: 0, ir: 0 },
        max: { red: 0, ir: 0 }
      };

      // Optimizado el bucle de procesamiento de píxeles
      for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
        if (y < 0 || y >= height) continue;
        
        for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
          if (x < 0 || x >= width) continue;
          
          const i = (y * width + x) * 4;
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          
          const ir = Math.round((red * 0.5 + green * 0.3 + blue * 0.2));

          // Mejorada la validación de píxeles
          if (red > this.minIntensity && red < this.maxIntensity && 
              red > green && red > blue) { // Asegura dominancia del rojo
            validPixels.red.push(red);
            validPixels.ir.push(ir);
            validPixels.sum.red += red;
            validPixels.sum.ir += ir;
            validPixels.count++;
            validPixels.max.red = Math.max(validPixels.max.red, red);
            validPixels.max.ir = Math.max(validPixels.max.ir, ir);
          }
        }
      }

      // Log detallado de la detección del dedo
      console.log('Estado del sensor:', {
        detectandoDedo: validPixels.count >= this.minValidPixels,
        pixelesValidos: validPixels.count,
        umbralMinimo: this.minValidPixels,
        valorRojo: validPixels.count > 0 ? (validPixels.sum.red / validPixels.count).toFixed(2) : '0'
      });

      if (validPixels.count < this.minValidPixels) {
        return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
      }

      const avgRed = validPixels.sum.red / validPixels.count;
      const avgIr = validPixels.sum.ir / validPixels.count;
      const redDominance = avgRed / avgIr;

      // Validación más estricta de la dominancia del rojo
      if (redDominance < this.redDominanceThreshold) {
        console.log('Señal débil:', {
          dominanciaRojo: redDominance,
          umbralNecesario: this.redDominanceThreshold
        });
        return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
      }

      // Manejo del buffer de valores
      if (this.lastRedValues.length >= this.smoothingWindow) {
        this.lastRedValues.shift();
        this.lastIrValues.shift();
      }
      this.lastRedValues.push(avgRed);
      this.lastIrValues.push(avgIr);

      // Aplicar filtros Kalman por separado para red e ir
      const filteredRed = this.applyKalmanFilter(
        this.calculateMean(this.lastRedValues),
        this.kalmanState.red
      );

      const filteredIr = this.applyKalmanFilter(
        this.calculateMean(this.lastIrValues),
        this.kalmanState.ir
      );

      const stability = this.calculateStability(filteredRed);
      const perfusionIndex = validPixels.max.red > 0 ? 
        (validPixels.max.red - Math.min(...validPixels.red)) / validPixels.max.red * 100 : 0;

      // Cálculo de calidad mejorado
      const qualities = {
        pixel: Math.min(1, validPixels.count / (this.minValidPixels * 2)),
        stability: stability > this.stabilityThreshold ? 1 : stability / this.stabilityThreshold,
        red: Math.min(1, redDominance / this.redDominanceThreshold),
        perfusion: Math.min(1, perfusionIndex / 30)
      };

      const quality = Math.min(
        qualities.pixel,
        qualities.stability,
        qualities.red,
        qualities.perfusion
      );

      if (this.frameCount % 30 === 0) {
        console.log('Métricas de calidad:', {
          ...qualities,
          finalQuality: quality,
          perfusionIndex
        });
      }

      return {
        red: filteredRed,
        ir: filteredIr,
        quality: quality,
        perfusionIndex
      };
    } catch (error) {
      console.error('Error en extractChannels:', error);
      return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
    }
  }
}
