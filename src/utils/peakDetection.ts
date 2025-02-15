
export class PeakDetector {
  private lastPeakTime = 0;
  private readonly minPeakDistance = 300;
  private readonly peakThreshold = 0.015;
  private readonly recentPeaks: number[] = [];
  private readonly maxRecentPeaks = 5;

  detectPeak(signal: number[], timestamp: number): boolean {
    if (signal.length < 2) return false;

    const lastValue = signal[signal.length - 1];
    const prevValue = signal[signal.length - 2];

    if (lastValue - prevValue > this.peakThreshold) {
      if (timestamp - this.lastPeakTime > this.minPeakDistance) {
        this.lastPeakTime = timestamp;

        this.recentPeaks.push(timestamp);
        if (this.recentPeaks.length > this.maxRecentPeaks) {
          this.recentPeaks.shift();
        }

        return true;
      }
    }

    return false;
  }

  getTimeSinceLastPeak(currentTime: number): number {
    return currentTime - this.lastPeakTime;
  }
}
