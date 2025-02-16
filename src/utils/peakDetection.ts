
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 400; // Aumentado para evitar falsos positivos
  private lastPeakTime = 0;
  private readonly bufferSize = 15; // Aumentado para mejor detección
  private readonly minAmplitude = 0.15; // Aumentado para mejor sensibilidad
  private readonly adaptiveRate = 0.2; // Aumentado para adaptación más rápida
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    
    if (now - this.lastPeakTime < this.minPeakDistance) {
      return false;
    }

    if (signalBuffer.length < 5) {
      return false;
    }

    const recentValues = signalBuffer.slice(-this.bufferSize);
    const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const stdDev = Math.sqrt(
      recentValues.reduce((a, b) => a + Math.pow(b - avgValue, 2), 0) / recentValues.length
    );

    // Umbral adaptativo mejorado
    this.adaptiveThreshold = avgValue + (stdDev * 0.8);

    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = currentValue > this.adaptiveThreshold && 
                                  currentValue > this.minAmplitude;
    const isLocalMaximum = this.isLocalMax(currentValue, signalBuffer);

    if (hasSignificantAmplitude && isLocalMaximum && isValidShape) {
      const currentInterval = now - this.lastPeakTime;
      
      if (this.validatePeakInterval(currentInterval)) {
        this.lastPeakTime = now;
        this.updatePeakHistory(currentValue, now);
        console.log('¡LATIDO DETECTADO!', {
          valor: currentValue,
          umbral: this.adaptiveThreshold,
          intervalo: currentInterval,
          bpmEstimado: 60000 / currentInterval
        });
        return true;
      }
    }

    return false;
  }

  private isLocalMax(currentValue: number, signalBuffer: number[]): boolean {
    const window = 3; // Ventana de análisis
    const recent = signalBuffer.slice(-window);
    return currentValue > Math.max(...recent);
  }

  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 4) return false;

    const last4Values = [...signalBuffer.slice(-3), currentValue];
    
    // Verificar forma de onda más estricta
    const isRising = last4Values[2] > last4Values[1] && last4Values[1] > last4Values[0];
    const isPeak = currentValue > last4Values[2];
    
    return isRising && isPeak;
  }

  private validatePeakInterval(currentInterval: number): boolean {
    if (this.timeBuffer.length < 2) {
      return currentInterval >= this.minPeakDistance;
    }

    const recentIntervals = this.timeBuffer.slice(-3);
    const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    
    // Tolerancia más estricta
    const maxVariation = 0.3;
    const isWithinRange = Math.abs(currentInterval - avgInterval) <= avgInterval * maxVariation;

    return isWithinRange && currentInterval >= this.minPeakDistance;
  }

  private updatePeakHistory(peakValue: number, timestamp: number) {
    if (this.peakBuffer.length >= this.bufferSize) {
      this.peakBuffer.shift();
      this.timeBuffer.shift();
    }
    
    this.peakBuffer.push(peakValue);
    this.timeBuffer.push(timestamp);

    // Log de calidad de detección
    if (this.timeBuffer.length > 1) {
      const intervals = this.timeBuffer.slice(1).map((t, i) => t - this.timeBuffer[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      console.log('Calidad de detección:', {
        intervalPromedio: avgInterval,
        bpmEstimado: 60000 / avgInterval,
        cantidadPicos: this.peakBuffer.length
      });
    }
  }

  getLastPeakTime(): number {
    return this.lastPeakTime;
  }
}
