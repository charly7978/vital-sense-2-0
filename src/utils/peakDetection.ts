
export class PeakDetector {
  private lastPeakTime = 0;
  private readonly minPeakDistance = 300; // Evita detecciones falsas muy seguidas (300ms)
  private readonly peakThreshold = 0.015; // Mínima amplitud para considerar un latido
  private readonly recentPeaks: number[] = [];
  private readonly maxRecentPeaks = 5;

  detectPeak(signal: number[], timestamp: number): boolean {
    if (signal.length < 2) return false;

    const lastValue = signal[signal.length - 1];
    const prevValue = signal[signal.length - 2];

    if (lastValue - prevValue > this.peakThreshold) {
      if (timestamp - this.lastPeakTime > this.minPeakDistance) {
        this.lastPeakTime = timestamp;

        // Evitar picos repetidos en tiempos similares
        this.recentPeaks.push(timestamp);
        if (this.recentPeaks.length > this.maxRecentPeaks) {
          this.recentPeaks.shift();
        }

        return true;
      }
    }

    return false;
  }
}
