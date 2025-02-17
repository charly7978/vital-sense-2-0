// ==================== PeakDetector.ts ====================

export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 400; // Aumentado para mejor estabilidad
  private lastPeakTime = 0;
  private readonly bufferSize = 60; // Aumentado para mejor análisis
  private readonly minAmplitude = 0.2; // Aumentado para reducir falsos positivos
  private readonly adaptiveRate = 0.3; // Ajustado para mejor adaptación
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;
  private readonly MAX_BPM = 180;
  private readonly MIN_BPM = 40;
  private readonly MIN_VALID_PEAKS = 3; // Aumentado para mejor validación
  private readonly MIN_SIGNAL_QUALITY = 0.4; // Aumentado para mejor precisión
  private readonly MIN_PEAK_AMPLITUDE = 0.3; // Ajustado para luz tenue
  private lastValidPeakValue = 0;

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    
    // Logging mejorado
    if (this.frameCount % 30 === 0) {
      console.log('🔍 Análisis de pico:', {
        valor: currentValue.toFixed(3),
        tiempo: now,
        ultimoPico: this.lastPeakTime,
        amplitud: Math.abs(currentValue).toFixed(3),
        umbralAdaptativo: this.adaptiveThreshold.toFixed(3)
      });
    }
    
    // Validación temporal mejorada
    const timeSinceLastPeak = now - this.lastPeakTime;
    const minTimeGap = (60 / this.MAX_BPM) * 1000 * 1.1; // 10% más estricto
    const maxTimeGap = (60 / this.MIN_BPM) * 1000;

    if (timeSinceLastPeak < minTimeGap) {
      return false;
    }

    // Validación de buffer
    if (signalBuffer.length < 10) {
      return false;
    }

    // Análisis de señal mejorado
    const recentValues = signalBuffer.slice(-this.bufferSize);
    const { mean, stdDev } = this.calculateSignalStats(recentValues);
    
    // Umbral adaptativo más robusto
    this.updateAdaptiveThreshold(mean, stdDev);

    // Validaciones mejoradas
    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = this.validateAmplitude(currentValue, mean, stdDev);
    const isLocalMaximum = this.isLocalMax(currentValue, signalBuffer);
    const signalQuality = this.calculateSignalQuality(signalBuffer);
    const isStable = this.validateSignalStability(signalBuffer);

    // Logging de validaciones
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

    if (isLocalMaximum && hasSignificantAmplitude && isValidShape && isStable) {
      if (timeSinceLastPeak > maxTimeGap) {
        this.resetPeakDetection(now);
        return false;
      }

      const currentInterval = timeSinceLastPeak;
      const isValidInterval = this.validatePeakInterval(currentInterval);
      
      if (isValidInterval && this.peakBuffer.length >= this.MIN_VALID_PEAKS) {
        // Validación adicional de consistencia
        if (this.validatePeakConsistency(currentValue)) {
          this.lastPeakTime = now;
          this.lastValidPeakValue = currentValue;
          this.updatePeakHistory(currentValue, now);
          
          const quality = this.calculatePeakQuality(currentValue, mean, stdDev);
          
          if (quality > 0.4) { // Umbral de calidad aumentado
            return true;
          }
        }
      }
    }

    return false;
  }

  private calculateSignalStats(values: number[]) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev };
  }

  private updateAdaptiveThreshold(mean: number, stdDev: number) {
    const targetThreshold = mean + (stdDev * 1.5);
    this.adaptiveThreshold = (
      this.adaptiveThreshold * (1 - this.adaptiveRate) +
      targetThreshold * this.adaptiveRate
    );
  }

  private isLocalMax(currentValue: number, signalBuffer: number[]): boolean {
    const window = 7; // Aumentado para mejor detección
    const recent = signalBuffer.slice(-window);
    return Math.abs(currentValue) === Math.max(...recent.map(Math.abs));
  }

  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 8) return false;

    const last8Values = [...signalBuffer.slice(-7), currentValue];
    
    // Análisis de forma mejorado
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

  private validatePeakInterval(currentInterval: number): boolean {
    if (this.timeBuffer.length < 2) {
      return currentInterval >= this.minPeakDistance;
    }

    const recentIntervals = this.timeBuffer.slice(-3);
    const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    
    const maxVariation = 0.3; // Reducido para mayor estabilidad
    const isWithinRange = Math.abs(currentInterval - avgInterval) <= avgInterval * maxVariation;
    const isPhysiologicallyValid = (
      currentInterval >= this.minPeakDistance && 
      currentInterval <= (60 / this.MIN_BPM) * 1000
    );

    return isPhysiologicallyValid && isWithinRange;
  }

  private validateSignalStability(signal: number[]): boolean {
    const { mean, stdDev } = this.calculateSignalStats(signal);
    const cv = stdDev / Math.abs(mean); // Coeficiente de variación
    return cv < 0.5; // Umbral de estabilidad
  }

  private validateAmplitude(value: number, mean: number, stdDev: number): boolean {
    const normalizedAmplitude = Math.abs(value - mean) / stdDev;
    return normalizedAmplitude > this.MIN_PEAK_AMPLITUDE;
  }

  private validatePeakConsistency(currentValue: number): boolean {
    if (this.lastValidPeakValue === 0) return true;
    const variation = Math.abs(currentValue - this.lastValidPeakValue) / this.lastValidPeakValue;
    return variation < 0.4; // 40% de variación máxima permitida
  }

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

  private calculateStability(signal: number[]): number {
    const { mean, stdDev } = this.calculateSignalStats(signal);
    return Math.exp(-Math.pow(stdDev / (mean + 1e-6), 2));
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
      const change = Math.abs(segmentMeans[i] - segmentMeans[i-1]) / (Math.abs(segmentMeans[i-1]) + 1e-6);
      if (change > 0.3) trendScore *= 0.7;
    }
    
    return trendScore;
  }

  private calculatePeakQuality(peakValue: number, mean: number, stdDev: number): number {
    const snr = (Math.abs(peakValue) - mean) / (stdDev + 1e-6);
    return Math.min(Math.max(snr / 4, 0), 1);
  }

  private updatePeakHistory(peakValue: number, timestamp: number) {
    if (this.peakBuffer.length >= this.bufferSize) {
      this.peakBuffer.shift();
      this.timeBuffer.shift();
    }
    
    this.peakBuffer.push(peakValue);
    this.timeBuffer.push(timestamp);

    // Análisis de intervalos mejorado
    if (this.timeBuffer.length > 1) {
      const intervals = this.timeBuffer.slice(1).map((t, i) => t - this.timeBuffer[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = 60000 / avgInterval;
      
      if (this.frameCount % 30 === 0) {
        console.log('📈 Análisis de latido:', {
          intervalPromedio: avgInterval.toFixed(0),
          bpmCalculado: bpm.toFixed(1),
          cantidadPicos: this.peakBuffer.length,
          calidadSeñal: this.calculateSignalQuality(this.peakBuffer).toFixed(3)
        });
      }
    }
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
