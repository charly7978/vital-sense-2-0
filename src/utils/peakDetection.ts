
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 250; // Reducido para mejor detección
  private lastPeakTime = 0;
  private readonly bufferSize = 15; // Reducido para menor latencia
  private readonly minAmplitude = 0.15;
  private readonly adaptiveRate = 0.3; // Aumentado para adaptación más rápida
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;
  private readonly MAX_BPM = 220; // Aumentado rango para capturar más casos
  private readonly MIN_BPM = 30;
  private readonly peakThreshold = 0.6; // Ajustado para mejor sensibilidad

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    
    const timeSinceLastPeak = now - this.lastPeakTime;
    const minTimeGap = (60 / this.MAX_BPM) * 1000;
    const maxTimeGap = (60 / this.MIN_BPM) * 1000;

    if (timeSinceLastPeak < minTimeGap) {
      return false;
    }

    if (signalBuffer.length < 5) { // Reducido para respuesta más rápida
      return false;
    }

    // Análisis de señal mejorado
    const recentValues = signalBuffer.slice(-8); // Ventana más pequeña
    const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    // Desviación estándar más sensible
    const positiveValues = recentValues.filter(v => v > avgValue);
    const stdDev = positiveValues.length > 0 ? 
      Math.sqrt(
        positiveValues.reduce((a, b) => a + Math.pow(b - avgValue, 2), 0) / positiveValues.length
      ) : 1;

    // Umbral adaptativo más sensible
    this.adaptiveThreshold = Math.abs(avgValue) + (stdDev * this.peakThreshold);

    // Validaciones optimizadas
    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = Math.abs(currentValue - avgValue) > this.adaptiveThreshold * 0.4;
    const isLocalMaximum = this.isLocalMax(currentValue, signalBuffer);

    if (isLocalMaximum && (hasSignificantAmplitude || isValidShape)) {
      if (timeSinceLastPeak > maxTimeGap) {
        this.lastPeakTime = now;
        this.peakBuffer = [];
        this.timeBuffer = [];
        return false;
      }

      const currentInterval = timeSinceLastPeak;
      const isValidInterval = this.validatePeakInterval(currentInterval);
      
      if (isValidInterval) {
        this.lastPeakTime = now;
        this.updatePeakHistory(currentValue, now);
        const estimatedBPM = 60000 / currentInterval;
        
        return true;
      }
    }

    return false;
  }

  private isLocalMax(currentValue: number, signalBuffer: number[]): boolean {
    const window = 3; // Ventana más pequeña para detección más precisa
    const recent = signalBuffer.slice(-window);
    const threshold = 0.8; // Más sensible
    const maxValue = Math.max(...recent.map(Math.abs));
    return Math.abs(currentValue) >= maxValue * threshold;
  }

  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 4) return false;

    const last4Values = [...signalBuffer.slice(-3), currentValue];
    
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < last4Values.length; i++) {
      if (Math.abs(last4Values[i]) > Math.abs(last4Values[i-1])) {
        increasing++;
      } else if (Math.abs(last4Values[i]) < Math.abs(last4Values[i-1])) {
        decreasing++;
      }
    }
    
    return increasing >= 1 && decreasing >= 1;
  }

  private validatePeakInterval(currentInterval: number): boolean {
    if (this.timeBuffer.length < 2) {
      return currentInterval >= this.minPeakDistance;
    }

    const recentIntervals = this.timeBuffer.slice(-2);
    const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    
    const maxVariation = 0.4; // Más tolerante a variaciones
    const isWithinRange = Math.abs(currentInterval - avgInterval) <= avgInterval * maxVariation;
    const isPhysiologicallyValid = currentInterval >= this.minPeakDistance && 
                                  currentInterval <= (60 / this.MIN_BPM) * 1000;

    return isPhysiologicallyValid && isWithinRange;
  }

  private calculatePeakQuality(peakValue: number, mean: number, stdDev: number): number {
    const snr = Math.abs(peakValue - mean) / (stdDev || 1);
    return Math.min(Math.max(snr / 3, 0), 1);
  }

  private updatePeakHistory(peakValue: number, timestamp: number) {
    if (this.peakBuffer.length >= this.bufferSize) {
      this.peakBuffer.shift();
      this.timeBuffer.shift();
    }
    
    this.peakBuffer.push(peakValue);
    this.timeBuffer.push(timestamp);

    if (this.timeBuffer.length > 1) {
      const intervals = this.timeBuffer.slice(1).map((t, i) => t - this.timeBuffer[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = 60000 / avgInterval;
      
      console.log('Análisis de latido:', {
        intervalPromedio: avgInterval,
        bpmCalculado: bpm,
        cantidadPicos: this.peakBuffer.length,
        calidadSeñal: this.calculateSignalQuality(intervals)
      });
    }
  }

  private calculateSignalQuality(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    const cv = stdDev / avgInterval;
    return Math.max(0, 1 - cv);
  }

  getLastPeakTime(): number {
    return this.lastPeakTime;
  }
}
