
export class SignalExtractor {
  private readonly minIntensity = 30; // Aumentado para mejor detección
  private readonly maxIntensity = 245;
  private readonly smoothingWindow = 10;
  private lastRedValues: number[] = [];
  private lastIrValues: number[] = [];
  private frameCount = 0;
  private readonly minValidPixels = 100; // Aumentado para requerir más área de dedo
  private readonly redDominanceThreshold = 1.2; // Aumentado para asegurar que sea dedo
  private readonly stabilityThreshold = 0.2;
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
        max: { red: 0, ir: 0 },
        min: { red: 255, ir: 255 }
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
          
          // Mejorada la detección de dedo verificando dominancia del rojo
          if (red > this.minIntensity && red < this.maxIntensity && 
              red > green * this.redDominanceThreshold && 
              red > blue * this.redDominanceThreshold) {
            
            const ir = Math.round((red * 0.5 + green * 0.3 + blue * 0.2));
            
            validPixels.red.push(red);
            validPixels.ir.push(ir);
            validPixels.sum.red += red;
            validPixels.sum.ir += ir;
            validPixels.count++;
            validPixels.max.red = Math.max(validPixels.max.red, red);
            validPixels.max.ir = Math.max(validPixels.max.ir, ir);
            validPixels.min.red = Math.min(validPixels.min.red, red);
            validPixels.min.ir = Math.min(validPixels.min.ir, ir);
          }
        }
      }

      // Verificación más estricta de la presencia del dedo
      if (validPixels.count < this.minValidPixels || 
          validPixels.max.red - validPixels.min.red < 20) { // Añadido check de rango dinámico
        console.log('No se detecta dedo:', {
          pixelCount: validPixels.count,
          minRequired: this.minValidPixels,
          redRange: validPixels.max.red - validPixels.min.red
        });
        return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
      }

      const avgRed = validPixels.sum.red / validPixels.count;
      const avgIr = validPixels.sum.ir / validPixels.count;

      // Manejo del buffer de valores
      if (this.lastRedValues.length >= this.smoothingWindow) {
        this.lastRedValues.shift();
        this.lastIrValues.shift();
      }
      this.lastRedValues.push(avgRed);
      this.lastIrValues.push(avgIr);

      // Aplicar filtros Kalman
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
        (validPixels.max.red - validPixels.min.red) / validPixels.max.red * 100 : 0;

      // Cálculo de calidad mejorado
      const qualities = {
        pixel: Math.min(1, validPixels.count / (this.minValidPixels * 2)),
        stability,
        red: Math.min(1, (avgRed / avgIr) / this.redDominanceThreshold),
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
          perfusionIndex,
          pixelCount: validPixels.count,
          redRange: validPixels.max.red - validPixels.min.red
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
