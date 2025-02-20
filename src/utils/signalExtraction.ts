
export class SignalExtractor {
  private readonly minIntensity = 15;
  private readonly maxIntensity = 245;
  private readonly smoothingWindow = 10;
  private readonly minValidPixels = 10;
  private readonly redDominanceThreshold = 0.95;
  private readonly stabilityThreshold = 0.1;
  private readonly pixelStep = 2;
  private lastStabilityValues: number[] = [];
  private frameCount = 0;

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
    const variance = this.lastStabilityValues.reduce((a, b) => 
      a + Math.pow(b - mean, 2), 0) / this.lastStabilityValues.length;
    
    return Math.max(0.1, 1 - Math.min(1, Math.sqrt(variance) / mean));
  }

  extractChannels(imageData: ImageData): { 
    red: number; 
    ir: number; 
    quality: number; 
    perfusionIndex: number 
  } {
    this.frameCount++;
    const { width, height, data } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.4);

    // Optimizar la extracción de píxeles
    const validPixels = this.extractValidPixels(data, width, centerX, centerY, regionSize);

    if (validPixels.count < this.minValidPixels) {
      console.log('❌ Píxeles válidos insuficientes:', validPixels.count);
      return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
    }

    const avgRed = validPixels.sum.red / validPixels.count;
    const avgIr = validPixels.sum.ir / validPixels.count;
    const redDominance = avgRed / avgIr;

    if (redDominance < this.redDominanceThreshold) {
      console.log('❌ Dominancia de rojo insuficiente:', redDominance);
      return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
    }

    // Aplicar filtros Kalman
    const filteredRed = this.applyKalmanFilter(avgRed, this.kalmanState.red);
    const filteredIr = this.applyKalmanFilter(avgIr, this.kalmanState.ir);

    // Calcular métricas de calidad
    const stability = this.calculateStability(filteredRed);
    const perfusionIndex = this.calculatePerfusionIndex(validPixels);
    const quality = this.calculateSignalQuality(validPixels, stability, redDominance);

    if (this.frameCount % 30 === 0) {
      console.log('📊 Métricas de señal:', {
        redPromedio: avgRed.toFixed(2),
        dominanciaRojo: redDominance.toFixed(2),
        estabilidad: stability.toFixed(2),
        calidadSeñal: quality.toFixed(2),
        indicePerfusion: perfusionIndex.toFixed(2)
      });
    }

    return {
      red: filteredRed,
      ir: filteredIr,
      quality: Math.max(0.15, quality),
      perfusionIndex
    };
  }

  private extractValidPixels(
    data: Uint8ClampedArray, 
    width: number,
    centerX: number,
    centerY: number,
    regionSize: number
  ) {
    const validPixels = {
      red: [] as number[],
      ir: [] as number[],
      count: 0,
      sum: { red: 0, ir: 0 },
      max: { red: 0, ir: 0 }
    };

    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      const rowOffset = y * width * 4;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        const i = rowOffset + x * 4;
        
        if (i < 0 || i >= data.length - 4) continue;

        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];
        
        if (red > this.minIntensity && red < this.maxIntensity) {
          const ir = Math.round((red * 0.5 + green * 0.3 + blue * 0.2));
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

    return validPixels;
  }

  private calculatePerfusionIndex(validPixels: ReturnType<typeof this.extractValidPixels>): number {
    if (validPixels.max.red === 0) return 0;
    return ((validPixels.max.red - Math.min(...validPixels.red)) / validPixels.max.red) * 100;
  }

  private calculateSignalQuality(
    validPixels: ReturnType<typeof this.extractValidPixels>,
    stability: number,
    redDominance: number
  ): number {
    const pixelQuality = Math.min(1, validPixels.count / (this.minValidPixels * 2));
    const stabilityQuality = stability > this.stabilityThreshold ? 
      1 : stability / this.stabilityThreshold;
    const dominanceQuality = Math.min(1, redDominance / this.redDominanceThreshold);
    
    return Math.min(pixelQuality, stabilityQuality, dominanceQuality);
  }
}

