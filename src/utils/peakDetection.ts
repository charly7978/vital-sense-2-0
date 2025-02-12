
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 180;
  private lastPeakTime = 0;
  private readonly bufferSize = 15;
  private readonly minAmplitude = 0.002;
  private readonly adaptiveRate = 0.35;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;
  private readonly maxBPM = 250;
  private readonly minBPM = 30;
  private lastPeakValues: number[] = [];
  private readonly peakMemory = 5;

  detectPeak(signal: number[], peakThreshold: number = 1.0): boolean {
    if (signal.length < 3) return false;

    // Obtener el valor actual y los dos anteriores
    const current = signal[signal.length - 1];
    const prev1 = signal[signal.length - 2];
    const prev2 = signal[signal.length - 3];

    // Un pico ocurre cuando el valor actual es menor que el anterior
    // y el anterior es mayor que el que le precede
    const isPotentialPeak = prev1 > current && prev1 > prev2;

    if (isPotentialPeak) {
      const now = Date.now();
      return this.validatePeak(prev1, now);
    }

    return false;
  }

  private validatePeak(peakValue: number, now: number): boolean {
    // Validar intervalo mínimo entre picos
    if (now - this.lastPeakTime < this.minPeakDistance) {
      return false;
    }

    // Calcular y actualizar umbral adaptativo
    if (this.peakBuffer.length > 0) {
      const avgPeak = this.peakBuffer.reduce((a, b) => a + b, 0) / this.peakBuffer.length;
      this.adaptiveThreshold = avgPeak * 0.6; // Reducido para mayor sensibilidad
    }

    // Validar amplitud mínima
    if (peakValue < this.adaptiveThreshold) {
      return false;
    }

    // Actualizar buffers
    this.peakBuffer.push(peakValue);
    this.timeBuffer.push(now);
    if (this.peakBuffer.length > this.bufferSize) {
      this.peakBuffer.shift();
      this.timeBuffer.shift();
    }

    // Validar intervalo para BPM realista
    if (this.timeBuffer.length >= 2) {
      const interval = this.timeBuffer[this.timeBuffer.length - 1] - this.timeBuffer[this.timeBuffer.length - 2];
      const bpm = 60000 / interval;
      if (bpm < this.minBPM || bpm > this.maxBPM) {
        return false;
      }
    }

    this.lastPeakTime = now;
    console.log('Pico detectado:', {
      valor: peakValue,
      umbral: this.adaptiveThreshold,
      intervaloPrevio: now - this.lastPeakTime,
      bufferSize: this.peakBuffer.length
    });

    return true;
  }

  private calculateMovingAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}
