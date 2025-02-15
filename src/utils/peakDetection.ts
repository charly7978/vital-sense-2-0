
export class PeakDetector {
  private lastPeakTime = 0;
  private readonly minPeakDistance = 300;
  private readonly peakThreshold = 0.015;
  private readonly recentPeaks: number[] = [];
  private readonly maxRecentPeaks = 5;

  detectPeak(signal: number[], timestamp: number): boolean {
    if (signal.length < 2) {
      console.log('❌ Señal insuficiente para detección de picos');
      return false;
    }

    const lastValue = signal[signal.length - 1];
    const prevValue = signal[signal.length - 2];
    const difference = lastValue - prevValue;
    const timeSinceLastPeak = timestamp - this.lastPeakTime;

    console.log('🔍 Análisis de pico:', {
      valorActual: lastValue,
      valorPrevio: prevValue,
      diferencia: difference,
      umbralPico: this.peakThreshold,
      tiempoDesdeUltimoPico: timeSinceLastPeak,
      distanciaMinima: this.minPeakDistance,
      picosRecientes: this.recentPeaks
    });

    if (difference > this.peakThreshold) {
      if (timeSinceLastPeak > this.minPeakDistance) {
        this.lastPeakTime = timestamp;
        this.recentPeaks.push(timestamp);
        if (this.recentPeaks.length > this.maxRecentPeaks) {
          this.recentPeaks.shift();
        }

        console.log('✅ Pico detectado:', {
          timestamp,
          tiempoDesdeUltimoPico: timeSinceLastPeak,
          picosGuardados: this.recentPeaks.length
        });

        return true;
      } else {
        console.log('⚠️ Pico ignorado: muy cercano al anterior');
      }
    }

    return false;
  }

  getTimeSinceLastPeak(currentTime: number): number {
    return currentTime - this.lastPeakTime;
  }
}
