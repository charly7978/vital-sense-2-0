
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 500; // ms
  private lastPeakTime = 0;

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    if (now - this.lastPeakTime < this.minPeakDistance) {
      return false;
    }

    if (signalBuffer.length < 3) {
      return false;
    }

    const recentValues = signalBuffer.slice(-5);
    const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const threshold = Math.max(avgValue * 0.6, this.adaptiveThreshold * 0.7);

    const isPeak = currentValue > threshold &&
                  currentValue > signalBuffer[signalBuffer.length - 2] &&
                  currentValue > signalBuffer[signalBuffer.length - 3] &&
                  this.validatePeakShape(currentValue, signalBuffer);

    if (isPeak) {
      this.lastPeakTime = now;
      this.adaptiveThreshold = this.adaptiveThreshold * 0.95 + currentValue * 0.05;
    }

    return isPeak;
  }

  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    const samples = signalBuffer.slice(-4);
    
    const derivative1 = samples[2] - samples[1];
    const derivative2 = samples[3] - samples[2];
    
    const hasCorrectShape = derivative1 > 0 && derivative2 < 0;
    const peakAmplitude = Math.abs(currentValue - Math.min(...samples));
    const hasSignificantAmplitude = peakAmplitude > this.adaptiveThreshold * 0.3;
    
    return hasCorrectShape && hasSignificantAmplitude;
  }

  getLastPeakTime(): number {
    return this.lastPeakTime;
  }
}
