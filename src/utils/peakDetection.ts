
export class PeakDetector {
  private lastPeakTime = 0;
  private readonly MIN_PEAK_DISTANCE = 300; // ms
  private readonly MAX_PEAK_DISTANCE = 1500; // ms
  private readonly PEAK_THRESHOLD = 0.015;
  private readonly BUFFER_SIZE = 30;
  private signalBuffer: number[] = [];
  private peakBuffer: number[] = [];
  private readonly MAX_PEAKS = 10;

  detectPeak(signal: number[], timestamp: number): boolean {
    if (signal.length < 2) return false;

    // Actualizar buffer circular
    this.signalBuffer.push(...signal);
    if (this.signalBuffer.length > this.BUFFER_SIZE) {
      this.signalBuffer.splice(0, this.signalBuffer.length - this.BUFFER_SIZE);
    }

    const currentValue = signal[signal.length - 1];
    const derivative = this.calculateDerivative(signal);
    const timeSinceLastPeak = timestamp - this.lastPeakTime;

    console.log('🔍 Análisis de pico:', {
      valor: currentValue,
      derivada: derivative,
      tiempoDesdeUltimo: timeSinceLastPeak
    });

    if (this.isPeakCandidate(currentValue, derivative, timeSinceLastPeak)) {
      if (this.validatePeak(currentValue)) {
        this.lastPeakTime = timestamp;
        this.peakBuffer.push(timestamp);
        if (this.peakBuffer.length > this.MAX_PEAKS) {
          this.peakBuffer.shift();
        }

        console.log('✅ Pico detectado:', {
          timestamp,
          intervalo: timeSinceLastPeak
        });

        return true;
      }
    }

    return false;
  }

  private calculateDerivative(signal: number[]): number {
    return signal[signal.length - 1] - signal[signal.length - 2];
  }

  private isPeakCandidate(value: number, derivative: number, timeSinceLastPeak: number): boolean {
    return derivative > this.PEAK_THRESHOLD &&
           timeSinceLastPeak >= this.MIN_PEAK_DISTANCE &&
           timeSinceLastPeak <= this.MAX_PEAK_DISTANCE;
  }

  private validatePeak(currentValue: number): boolean {
    return this.signalBuffer
      .slice(-5)
      .every(v => v <= currentValue);
  }

  getTimeSinceLastPeak(currentTime: number): number {
    return currentTime - this.lastPeakTime;
  }

  reset(): void {
    this.lastPeakTime = 0;
    this.signalBuffer = [];
    this.peakBuffer = [];
  }
}
