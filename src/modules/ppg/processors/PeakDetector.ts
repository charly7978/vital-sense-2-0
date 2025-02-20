
export class PeakDetector {
  isRealPeak(value: number, timestamp: number, buffer: number[]): boolean {
    // Implementación simplificada para demo
    return value > Math.max(...buffer) * 0.8;
  }
}
