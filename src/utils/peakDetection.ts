
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 300; // ms
  private lastPeakTime = 0;
  private readonly bufferSize = 30;
  private readonly minAmplitude = 0.1;
  private readonly adaptiveRate = 0.2;
  private readonly MAX_BPM = 220;
  private readonly MIN_BPM = 30;
  private readonly qualityThreshold = 0.6;
  private readonly stdDevThreshold = 1.5;
  private readonly minPeakProminence = 0.3;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 8) return false;

    // Calcular estadísticas de la señal
    const stats = this.calculateSignalStats(signalBuffer);
    const { mean, stdDev } = stats;

    // Verificar calidad de señal
    if (!this.validateSignalQuality(signalBuffer, stats)) {
      console.log('❌ Calidad de señal insuficiente:', stats);
      return false;
    }

    // Calcular umbral adaptativo
    this.updateAdaptiveThreshold(mean, stdDev);

    // Verificar distancia temporal desde último pico
    const timeSinceLastPeak = now - this.lastPeakTime;
    if (!this.validateTimeInterval(timeSinceLastPeak)) {
      return false;
    }

    // Verificar si es un máximo local
    if (!this.isLocalMaximum(currentValue, signalBuffer)) {
      return false;
    }

    // Verificar prominencia del pico
    const prominence = this.calculatePeakProminence(currentValue, signalBuffer);
    if (prominence < this.minPeakProminence) {
      console.log('❌ Prominencia insuficiente:', prominence);
      return false;
    }

    // Verificar forma del pico
    if (!this.validatePeakShape(currentValue, signalBuffer)) {
      console.log('❌ Forma de pico inválida');
      return false;
    }

    // Si pasa todas las validaciones, es un pico válido
    this.updatePeakHistory(currentValue, now);
    console.log('✅ Pico válido detectado:', {
      valor: currentValue,
      tiempo: now,
      prominencia: prominence,
      calidadSeñal: stats.quality
    });

    return true;
  }

  private calculateSignalStats(signal: number[]): {
    mean: number;
    stdDev: number;
    quality: number;
  } {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const stdDev = Math.sqrt(variance);
    
    // Calcular calidad basada en variabilidad y amplitud
    const normalizedStdDev = stdDev / (Math.abs(mean) + 1e-6);
    const quality = Math.exp(-normalizedStdDev);

    return { mean, stdDev, quality };
  }

  private validateSignalQuality(signal: number[], stats: { quality: number }): boolean {
    if (stats.quality < this.qualityThreshold) {
      return false;
    }

    // Verificar estabilidad de la señal
    const recentValues = signal.slice(-5);
    const localVariation = Math.max(...recentValues) - Math.min(...recentValues);
    return localVariation > this.minAmplitude;
  }

  private updateAdaptiveThreshold(mean: number, stdDev: number): void {
    const targetThreshold = mean + this.stdDevThreshold * stdDev;
    this.adaptiveThreshold = (1 - this.adaptiveRate) * this.adaptiveThreshold + 
                            this.adaptiveRate * targetThreshold;
  }

  private validateTimeInterval(interval: number): boolean {
    const minInterval = (60 / this.MAX_BPM) * 1000;
    const maxInterval = (60 / this.MIN_BPM) * 1000;
    
    return interval >= minInterval && interval <= maxInterval;
  }

  private isLocalMaximum(value: number, signal: number[]): boolean {
    const window = 3;
    const center = signal.length - 1;
    
    for (let i = Math.max(0, center - window); i <= Math.min(signal.length - 1, center + window); i++) {
      if (i !== center && signal[i] >= value) {
        return false;
      }
    }
    
    return true;
  }

  private calculatePeakProminence(value: number, signal: number[]): number {
    const leftMin = Math.min(...signal.slice(-8));
    const rightMin = Math.min(...signal.slice(-7));
    return Math.min(value - leftMin, value - rightMin);
  }

  private validatePeakShape(value: number, signal: number[]): boolean {
    const window = signal.slice(-6);
    let increasing = 0;
    let decreasing = 0;

    for (let i = 1; i < window.length; i++) {
      if (window[i] > window[i-1]) increasing++;
      if (window[i] < window[i-1]) decreasing++;
    }

    // Verificar patrón de subida y bajada
    return increasing >= 2 && decreasing >= 1;
  }

  private updatePeakHistory(value: number, timestamp: number): void {
    this.lastPeakTime = timestamp;
    
    if (this.peakBuffer.length >= this.bufferSize) {
      this.peakBuffer.shift();
      this.timeBuffer.shift();
    }
    
    this.peakBuffer.push(value);
    this.timeBuffer.push(timestamp);
  }

  getLastPeakTime(): number {
    return this.lastPeakTime;
  }
}

