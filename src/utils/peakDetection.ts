
export class PeakDetector {
  private lastPeakTime = 0;
  private readonly minPeakDistance = 300; // ms
  private readonly maxPeakDistance = 1500; // ms
  private readonly peakThreshold = 0.015;
  private recentPeaks: number[] = [];
  private readonly maxRecentPeaks = 10;
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 30;

  detectPeak(signal: number[], timestamp: number): boolean {
    if (signal.length < 2) {
      console.log('❌ Señal insuficiente para detección');
      return false;
    }

    // Actualizar buffer
    this.signalBuffer.push(...signal);
    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer.splice(0, this.signalBuffer.length - this.bufferSize);
    }

    const currentValue = signal[signal.length - 1];
    const previousValue = signal[signal.length - 2];
    const derivative = currentValue - previousValue;
    const timeSinceLastPeak = timestamp - this.lastPeakTime;

    console.log('🔍 Análisis de pico:', {
      valorActual: currentValue,
      valorAnterior: previousValue,
      derivada: derivative,
      tiempoDesdeUltimoPico: timeSinceLastPeak,
      umbral: this.peakThreshold
    });

    // Verificar si es un pico válido
    if (derivative > this.peakThreshold && 
        timeSinceLastPeak >= this.minPeakDistance &&
        timeSinceLastPeak <= this.maxPeakDistance) {
      
      // Verificar que es un máximo local
      const isLocalMaximum = this.signalBuffer
        .slice(-5)
        .every(v => v <= currentValue);

      if (isLocalMaximum) {
        this.lastPeakTime = timestamp;
        this.recentPeaks.push(timestamp);
        
        if (this.recentPeaks.length > this.maxRecentPeaks) {
          this.recentPeaks.shift();
        }

        console.log('✅ Pico detectado:', {
          timestamp,
          intervalo: timeSinceLastPeak,
          picosGuardados: this.recentPeaks.length
        });

        return true;
      }
    }

    return false;
  }

  getTimeSinceLastPeak(currentTime: number): number {
    return currentTime - this.lastPeakTime;
  }

  reset() {
    this.lastPeakTime = 0;
    this.recentPeaks = [];
    this.signalBuffer.length = 0;
  }
}
