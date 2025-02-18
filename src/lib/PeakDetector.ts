export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 400;
  private lastPeakTime = 0;
  private readonly bufferSize = 60;
  private readonly minAmplitude = 0.3;
  private readonly adaptiveRate = 0.3;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;
  private readonly MAX_BPM = 180;
  private readonly MIN_BPM = 45;
  private readonly MIN_VALID_PEAKS = 4;
  private readonly MIN_SIGNAL_QUALITY = 0.45;
  private readonly MIN_PEAK_AMPLITUDE = 0.35;
  private lastValidPeakValue = 0;

  public updateAdaptiveThreshold(mean: number, stdDev: number): void {
    this.adaptiveThreshold = mean + stdDev * 2;
  }

  public validateAmplitude(currentValue: number, mean: number, stdDev: number): boolean {
    return Math.abs(currentValue - mean) > stdDev * this.MIN_PEAK_AMPLITUDE;
  }

  public validateSignalStability(signal: number[]): boolean {
    if (signal.length < 10) return false;
    const { mean, stdDev } = this.calculateSignalStats(signal);
    return stdDev / (mean + 1e-6) < 0.5;
  }

  public validatePeakConsistency(currentValue: number): boolean {
    if (this.lastValidPeakValue === 0) return true;
    const difference = Math.abs(currentValue - this.lastValidPeakValue);
    return difference / (this.lastValidPeakValue + 1e-6) < 0.3;
  }

  public updatePeakHistory(value: number, time: number): void {
    this.peakBuffer.push(value);
    this.timeBuffer.push(time);
    if (this.peakBuffer.length > this.bufferSize) {
      this.peakBuffer.shift();
      this.timeBuffer.shift();
    }
  }

  public calculatePeakQuality(currentValue: number, mean: number, stdDev: number): number {
    const amplitude = Math.abs(currentValue - mean) / stdDev;
    return Math.min(amplitude / 3, 1);
  }

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    
    // OPTIMIZACIÓN: Logging mejorado para debugging
    if (this.frameCount % 30 === 0) {
      console.log('🔍 Análisis de pico:', {
        valor: currentValue.toFixed(3),
        tiempo: now,
        ultimoPico: this.lastPeakTime,
        amplitud: Math.abs(currentValue).toFixed(3),
        umbralAdaptativo: this.adaptiveThreshold.toFixed(3)
      });
    }
    
    // OPTIMIZACIÓN: Validación temporal más estricta
    const timeSinceLastPeak = now - this.lastPeakTime;
    const minTimeGap = (60 / this.MAX_BPM) * 1000 * 1.1; // 10% más estricto
    const maxTimeGap = (60 / this.MIN_BPM) * 1000;

    if (timeSinceLastPeak < minTimeGap) {
      return false;
    }

    // OPTIMIZACIÓN: Mejor validación de buffer
    if (signalBuffer.length < 10) {
      return false;
    }

    // OPTIMIZACIÓN: Análisis de señal mejorado
    const recentValues = signalBuffer.slice(-this.bufferSize);
    const { mean, stdDev } = this.calculateSignalStats(recentValues);
    
    // OPTIMIZACIÓN: Umbral adaptativo más robusto
    this.updateAdaptiveThreshold(mean, stdDev);

    // OPTIMIZACIÓN: Validaciones múltiples mejoradas
    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = this.validateAmplitude(currentValue, mean, stdDev);
    const isLocalMaximum = this.isLocalMax(currentValue, signalBuffer);
    const signalQuality = this.calculateSignalQuality(signalBuffer);
    const isStable = this.validateSignalStability(signalBuffer);

    // OPTIMIZACIÓN: Logging de validaciones mejorado
    if (this.frameCount % 30 === 0) {
      console.log('🎯 Validaciones:', {
        formaValida: isValidShape,
        amplitudSignificativa: hasSignificantAmplitude,
        esMaximoLocal: isLocalMaximum,
        calidadSenal: signalQuality.toFixed(3),
        estable: isStable,
        umbral: this.adaptiveThreshold.toFixed(3)
      });
    }

    if (signalQuality < this.MIN_SIGNAL_QUALITY) {
      return false;
    }

    // OPTIMIZACIÓN: Validación completa mejorada
    if (isLocalMaximum && hasSignificantAmplitude && isValidShape && isStable) {
      if (timeSinceLastPeak > maxTimeGap) {
        this.resetPeakDetection(now);
        return false;
      }

      const currentInterval = timeSinceLastPeak;
      const isValidInterval = this.validatePeakInterval(currentInterval);
      
      if (isValidInterval && this.peakBuffer.length >= this.MIN_VALID_PEAKS) {
        if (this.validatePeakConsistency(currentValue)) {
          this.lastPeakTime = now;
          this.lastValidPeakValue = currentValue;
          this.updatePeakHistory(currentValue, now);
          
          const quality = this.calculatePeakQuality(currentValue, mean, stdDev);
          
          if (quality > 0.4) {
            return true;
          }
        }
      }
    }

    return false;
  }

  // OPTIMIZACIÓN: Mejor detección de máximos locales
  private isLocalMax(currentValue: number, signalBuffer: number[]): boolean {
    const window = 7; // Antes: 5 (más preciso)
    const recent = signalBuffer.slice(-window);
    return Math.abs(currentValue) === Math.max(...recent.map(Math.abs));
  }

  // OPTIMIZACIÓN: Validación de forma de pico mejorada
  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 8) return false;

    const last8Values = [...signalBuffer.slice(-7), currentValue];
    
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < 4; i++) {
      if (Math.abs(last8Values[i]) > Math.abs(last8Values[i-1])) {
        increasing++;
      }
    }
    
    for (let i = 5; i < 8; i++) {
      if (Math.abs(last8Values[i]) < Math.abs(last8Values[i-1])) {
        decreasing++;
      }
    }
    
    return increasing >= 2 && decreasing >= 2;
  }

  // OPTIMIZACIÓN: Validación de intervalo más estricta
  private validatePeakInterval(currentInterval: number): boolean {
    if (this.timeBuffer.length < 2) {
      return currentInterval >= this.minPeakDistance;
    }

    const recentIntervals = this.timeBuffer.slice(-3);
    const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    
    const maxVariation = 0.3; // Antes: 0.4 (más estricto)
    const isWithinRange = Math.abs(currentInterval - avgInterval) <= avgInterval * maxVariation;
    const isPhysiologicallyValid = 
      currentInterval >= this.minPeakDistance && 
      currentInterval <= (60 / this.MIN_BPM) * 1000;

    return isPhysiologicallyValid && isWithinRange;
  }

  // OPTIMIZACIÓN: Mejor cálculo de calidad de señal
  private calculateSignalQuality(signal: number[]): number {
    const { mean, stdDev } = this.calculateSignalStats(signal);
    
    const snr = mean / (stdDev + 1e-6);
    const stability = this.calculateStability(signal);
    const trend = this.calculateTrend(signal);
    
    return Math.min(
      (snr * 0.4 + stability * 0.4 + trend * 0.2),
      1
    );
  }

  // OPTIMIZACIÓN: Métodos auxiliares mejorados
  private calculateSignalStats(values: number[]) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev };
  }

  private calculateStability(signal: number[]): number {
    const { mean, stdDev } = this.calculateSignalStats(signal);
    return Math.exp(-stdDev / (mean + 1e-6));
  }

  private calculateTrend(signal: number[]): number {
    const segments = 4;
    const segmentSize = Math.floor(signal.length / segments);
    const segmentMeans = [];
    
    for (let i = 0; i < segments; i++) {
      const segment = signal.slice(i * segmentSize, (i + 1) * segmentSize);
      segmentMeans.push(segment.reduce((a, b) => a + b, 0) / segment.length);
    }
    
    let trendScore = 1;
    for (let i = 1; i < segmentMeans.length; i++) {
      const change = Math.abs(segmentMeans[i] - segmentMeans[i-1]) / 
                    (Math.abs(segmentMeans[i-1]) + 1e-6);
      if (change > 0.3) trendScore *= 0.7;
    }
    
    return trendScore;
  }

  private resetPeakDetection(now: number) {
    this.lastPeakTime = now;
    this.peakBuffer = [];
    this.timeBuffer = [];
    this.lastValidPeakValue = 0;
  }

  getLastPeakTime(): number {
    return this.lastPeakTime;
  }
}
