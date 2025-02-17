
export class SignalExtractor {
  private readonly minIntensity = 15;
  private readonly maxIntensity = 245;
  private readonly smoothingWindow = 5; // Reducido para menor latencia
  private lastRedValues: number[] = [];
  private lastIrValues: number[] = [];
  private frameCount = 0;
  private readonly minValidPixels = 50; // Reducido para respuesta más rápida
  private readonly redDominanceThreshold = 1.1; // Reducido ligeramente para detección más rápida
  private readonly stabilityThreshold = 0.1;
  private lastStabilityValues: number[] = [];
  private readonly pixelStep = 4; // Aumentado para procesar menos píxeles

  private kalmanState = {
    red: { q: 0.1, r: 0.8, p: 1, x: 0, k: 0 }, // Ajustado para respuesta más rápida
    ir: { q: 0.1, r: 0.8, p: 1, x: 0, k: 0 }
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
    if (this.lastStabilityValues.length > 10) { // Reducido para menor latencia
      this.lastStabilityValues.shift();
    }

    if (this.lastStabilityValues.length < 3) return 0; // Reducido mínimo de muestras

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
      const regionSize = Math.floor(Math.min(width, height) * 0.3); // Reducido para procesar menos área

      const validPixels = {
        red: [] as number[],
        ir: [] as number[],
        count: 0,
        sum: { red: 0, ir: 0 },
        max: { red: 0, ir: 0 }
      };

      // Procesamiento optimizado de píxeles
      for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
        if (y < 0 || y >= height) continue;
        
        for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
          if (x < 0 || x >= width) continue;
          
          const i = (y * width + x) * 4;
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          
          const ir = Math.round((red * 0.5 + green * 0.3 + blue * 0.2));

          if (red > this.minIntensity && red < this.maxIntensity && 
              red > green && red > blue) {
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

      if (validPixels.count < this.minValidPixels) {
        return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
      }

      const avgRed = validPixels.sum.red / validPixels.count;
      const avgIr = validPixels.sum.ir / validPixels.count;
      const redDominance = avgRed / avgIr;

      if (redDominance < this.redDominanceThreshold) {
        return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
      }

      // Buffer de valores más pequeño
      if (this.lastRedValues.length >= this.smoothingWindow) {
        this.lastRedValues.shift();
        this.lastIrValues.shift();
      }
      this.lastRedValues.push(avgRed);
      this.lastIrValues.push(avgIr);

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
