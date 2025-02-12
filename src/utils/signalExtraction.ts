
export class SignalExtractor {
  private readonly minIntensity = 50; // Aumentado para mejor detección
  private readonly maxIntensity = 240;
  private readonly smoothingWindow = 5; // Reducido para mejor respuesta en tiempo real
  private lastRedValues: number[] = [];
  private lastIrValues: number[] = [];
  private frameCount = 0;
  private readonly minValidPixels = 500; // Aumentado significativamente
  private readonly redDominanceThreshold = 1.5; // Más estricto
  private readonly stabilityThreshold = 0.3;
  private lastStabilityValues: number[] = [];
  private readonly pixelStep = 2;
  private readonly minRedRange = 30; // Mínima variación requerida

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
    if (values.length === 0) return 0;
    return values.reduce((a, b) => a + b, 0) / values.length;
  }

  private calculateStability(value: number): number {
    this.lastStabilityValues.push(value);
    if (this.lastStabilityValues.length > 10) { // Reducido para mejor respuesta
      this.lastStabilityValues.shift();
    }

    if (this.lastStabilityValues.length < 3) return 0;

    const mean = this.calculateMean(this.lastStabilityValues);
    if (mean === 0) return 0;
    
    const variance = this.lastStabilityValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.lastStabilityValues.length;
    return Math.max(0, 1 - Math.min(1, Math.sqrt(variance) / mean));
  }

  extractChannels(imageData: ImageData): { red: number; ir: number; quality: number; perfusionIndex: number } {
    try {
      this.frameCount++;
      const { width, height, data } = imageData;
      const centerX = Math.floor(width / 2);
      const centerY = Math.floor(height / 2);
      const regionSize = Math.floor(Math.min(width, height) * 0.3); // Reducido para ser más preciso

      const validPixels = {
        red: [] as number[],
        ir: [] as number[],
        count: 0,
        sum: { red: 0, ir: 0 },
        max: { red: 0, ir: 0 },
        min: { red: 255, ir: 255 }
      };

      // Análisis de píxeles más preciso
      for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
        if (y < 0 || y >= height) continue;
        
        for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
          if (x < 0 || x >= width) continue;
          
          const i = (y * width + x) * 4;
          const red = data[i];
          const green = data[i + 1];
          const blue = data[i + 2];
          
          // Detección de dedo más estricta
          const isRedDominant = red > green * this.redDominanceThreshold && 
                              red > blue * this.redDominanceThreshold;
          const isInRange = red >= this.minIntensity && red <= this.maxIntensity;
          const isBrightEnough = (red + green + blue) / 3 > 40; // Verificación de brillo
          
          if (isRedDominant && isInRange && isBrightEnough) {
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

      // Verificación estricta de presencia de dedo
      const redRange = validPixels.max.red - validPixels.min.red;
      const hasEnoughPixels = validPixels.count >= this.minValidPixels;
      const hasEnoughVariation = redRange >= this.minRedRange;
      const meanRed = validPixels.count > 0 ? validPixels.sum.red / validPixels.count : 0;

      if (!hasEnoughPixels || !hasEnoughVariation || meanRed < this.minIntensity) {
        if (this.frameCount % 10 === 0) {
          console.log('No se detecta dedo correctamente:', {
            pixelCount: validPixels.count,
            minRequired: this.minValidPixels,
            redRange,
            minRedRange: this.minRedRange,
            meanRed,
            minIntensity: this.minIntensity
          });
        }
        return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
      }

      // Procesamiento de señal más preciso
      const avgRed = validPixels.sum.red / validPixels.count;
      const avgIr = validPixels.sum.ir / validPixels.count;

      if (this.lastRedValues.length >= this.smoothingWindow) {
        this.lastRedValues.shift();
        this.lastIrValues.shift();
      }
      this.lastRedValues.push(avgRed);
      this.lastIrValues.push(avgIr);

      const filteredRed = this.applyKalmanFilter(avgRed, this.kalmanState.red);
      const filteredIr = this.applyKalmanFilter(avgIr, this.kalmanState.ir);

      const stability = this.calculateStability(filteredRed);
      const perfusionIndex = (redRange / validPixels.max.red) * 100;

      // Cálculo de calidad más preciso
      const qualities = {
        pixel: Math.min(1, validPixels.count / (this.minValidPixels * 1.5)),
        stability,
        redDominance: Math.min(1, (avgRed / avgIr) / this.redDominanceThreshold),
        perfusion: Math.min(1, perfusionIndex / 20)
      };

      const quality = Math.min(
        qualities.pixel,
        qualities.stability,
        qualities.redDominance,
        qualities.perfusion
      );

      if (this.frameCount % 10 === 0) { // Logging más frecuente
        console.log('Métricas en tiempo real:', {
          ...qualities,
          calidad: quality,
          pixeles: validPixels.count,
          rangoRojo: redRange,
          estabilidad: stability,
          perfusion: perfusionIndex
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
