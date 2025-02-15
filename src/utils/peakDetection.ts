export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 300; // Ajuste para mejorar la detección (300ms mínimo entre picos)
  private lastPeakTime = 0;
  private readonly bufferSize = 30;
  private readonly minAmplitude = 0.005; 
  private readonly adaptiveRate = 0.5;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private readonly maxBPM = 200;
  private readonly minBPM = 40;
  private lastPeakValues: number[] = [];
  private readonly peakMemory = 10;

  detectPeak(signal: number[], timestamp: number): boolean {
    if (signal.length < this.bufferSize) return false;

    const lastValue = signal[signal.length - 1];
    const prevValue = signal[signal.length - 2];

    if (lastValue > prevValue + this.minAmplitude) {
      if (timestamp - this.lastPeakTime > this.minPeakDistance) {
        this.lastPeakTime = timestamp;
        return true;
      }
    }

    return false;
  }
}
