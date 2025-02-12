
export class SignalExtractor {
  private readonly minIntensity = 15; // Reducido para mejor detección
  private readonly maxIntensity = 245; // Aumentado para mejor rango
  private readonly smoothingWindow = 10;
  private lastRedValues: number[] = [];
  private lastIrValues: number[] = [];
  private frameCount = 0;
  private readonly minValidPixels = 10; // Reducido para ser más sensible
  private readonly redDominanceThreshold = 0.95; // Reducido para ser más sensible
  private readonly stabilityThreshold = 0.1;
  private lastStabilityValues: number[] = [];
  private readonly pixelStep = 1;

  private kalman = {
    q: 0.05,
    r: 1.2,
    p: 1,
    x: 0,
    k: 0
  };

  private applyKalmanFilter(measurement: number) {
    this.kalman.p = this.kalman.p + this.kalman.q;
    this.kalman.k = this.kalman.p / (this.kalman.p + this.kalman.r);
    this.kalman.x = this.kalman.x + this.kalman.k * (measurement - this.kalman.x);
    this.kalman.p = (1 - this.kalman.k) * this.kalman.p;
    return this.kalman.x;
  }

  private calculateStability(value: number): number {
    this.lastStabilityValues.push(value);
    if (this.lastStabilityValues.length > 15) {
      this.lastStabilityValues.shift();
    }

    if (this.lastStabilityValues.length < 5) return 0;

    const mean = this.lastStabilityValues.reduce((a, b) => a + b, 0) / this.lastStabilityValues.length;
    const variance = this.lastStabilityValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.lastStabilityValues.length;
    const stability = 1 - Math.min(1, Math.sqrt(variance) / mean);
    
    return Math.max(0.1, stability);
  }

  extractChannels(imageData: ImageData): { red: number; ir: number; quality: number; perfusionIndex: number } {
    this.frameCount++;
    let redSum = 0, irSum = 0, pixelCount = 0;
    let maxRed = 0, maxIr = 0;

    const { width, height } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.4); // Aumentado para capturar más área

    const validRedValues: number[] = [];
    const validIrValues: number[] = [];

    // Procesamiento de píxeles optimizado
    for (let y = centerY - regionSize; y < centerY + regionSize; y += this.pixelStep) {
      if (y < 0 || y >= height) continue;
      
      for (let x = centerX - regionSize; x < centerX + regionSize; x += this.pixelStep) {
        if (x < 0 || x >= width) continue;
        
        const i = (y * width + x) * 4;
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];
        
        // Mejorado el cálculo de IR con más peso en rojo
        const ir = Math.round((red * 0.5 + green * 0.3 + blue * 0.2));

        if (red > this.minIntensity && red < this.maxIntensity) {
          validRedValues.push(red);
          validIrValues.push(ir);
          redSum += red;
          irSum += ir;
          pixelCount++;
          maxRed = Math.max(maxRed, red);
          maxIr = Math.max(maxIr, ir);
        }
      }
    }

    if (pixelCount < this.minValidPixels || validRedValues.length === 0) {
      console.log('Señal débil detectada:', { pixelCount, minRequired: this.minValidPixels });
      return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
    }

    let avgRed = redSum / pixelCount;
    let avgIr = irSum / pixelCount;

    const redDominance = avgRed / avgIr;
    if (redDominance < this.redDominanceThreshold) {
      console.log('Dominancia roja insuficiente:', { redDominance, threshold: this.redDominanceThreshold });
      return { red: 0, ir: 0, quality: 0, perfusionIndex: 0 };
    }

    if (this.lastRedValues.length >= this.smoothingWindow) {
      this.lastRedValues.shift();
      this.lastIrValues.shift();
    }
    this.lastRedValues.push(avgRed);
    this.lastIrValues.push(avgIr);

    const filteredRed = this.applyKalmanFilter(
      this.lastRedValues.reduce((a, b) => a + b, 0) / this.lastRedValues.length
    );

    const filteredIr = this.applyKalmanFilter(
      this.lastIrValues.reduce((a, b) => a + b, 0) / this.lastIrValues.length
    );

    const stability = this.calculateStability(filteredRed);
    const perfusionIndex = maxRed > 0 ? (maxRed - Math.min(...validRedValues)) / maxRed * 100 : 0;

    const pixelQuality = Math.min(1, pixelCount / (this.minValidPixels * 2));
    const stabilityQuality = stability > this.stabilityThreshold ? 1 : stability / this.stabilityThreshold;
    const redQuality = Math.min(1, redDominance / this.redDominanceThreshold);
    const perfusionQuality = Math.min(1, perfusionIndex / 30);
    
    const quality = Math.min(
      pixelQuality, 
      stabilityQuality, 
      redQuality,
      perfusionQuality
    );

    if (this.frameCount % 30 === 0) {
      console.log('Métricas de calidad:', {
        pixelQuality,
        stabilityQuality,
        redQuality,
        perfusionQuality,
        finalQuality: quality,
        perfusionIndex
      });
    }

    return { 
      red: filteredRed, 
      ir: filteredIr, 
      quality: Math.max(0.15, quality),
      perfusionIndex 
    };
  }
}
