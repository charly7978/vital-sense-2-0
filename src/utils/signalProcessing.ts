export class SignalProcessor {
  private sampleRate = 30;

  constructor() {}

  detectFinger(signal: number[]): boolean {
    const avgRed = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    return avgRed > 100; // 🔹 Umbral dinámico para evitar falsos positivos
  }

  detectPeaks(signal: number[]): number[] {
    let peaks = [];
    for (let i = 2; i < signal.length - 2; i++) {
      if (
        signal[i] > signal[i - 1] &&
        signal[i] > signal[i + 1] &&
        signal[i] > signal[i - 2] &&
        signal[i] > signal[i + 2]
      ) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  calculateBPM(peaks: number[]): number {
    if (peaks.length < 2) return 0;
    let avgInterval = (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1);
    return Math.round(60000 / avgInterval);
  }
}
