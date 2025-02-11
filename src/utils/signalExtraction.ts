
export class SignalExtractor {
  private readonly minIntensity = 45;
  private readonly maxIntensity = 250;
  private readonly smoothingWindow = 5;
  private lastRedValues: number[] = [];
  private lastIrValues: number[] = [];
  private frameCount = 0;

  private kalman = {
    q: 0.1,
    r: 0.8,
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

  extractChannels(imageData: ImageData) {
    this.frameCount++;
    let redSum = 0, irSum = 0, pixelCount = 0;

    const { width, height } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = 50;

    for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
      for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
        const i = (y * width + x) * 4;
        const red = imageData.data[i];
        const green = imageData.data[i + 1];
        const blue = imageData.data[i + 2];

        if (red > this.minIntensity) {
          redSum += red;
          irSum += (green + blue) / 2;
          pixelCount++;
        }
      }
    }

    if (pixelCount === 0) return { red: 0, ir: 0, quality: 0 };

    let avgRed = redSum / pixelCount;
    let avgIr = irSum / pixelCount;

    this.lastRedValues.push(avgRed);
    this.lastIrValues.push(avgIr);
    if (this.lastRedValues.length > this.smoothingWindow) this.lastRedValues.shift();
    if (this.lastIrValues.length > this.smoothingWindow) this.lastIrValues.shift();

    avgRed = this.applyKalmanFilter(
      this.lastRedValues.reduce((a, b) => a + b, 0) / this.lastRedValues.length
    );

    avgIr = this.applyKalmanFilter(
      this.lastIrValues.reduce((a, b) => a + b, 0) / this.lastIrValues.length
    );

    return { red: avgRed, ir: avgIr, quality: 1 };
  }
}
