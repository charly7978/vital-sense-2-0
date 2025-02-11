export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 300; // Reducido para detectar frecuencias cardíacas más altas
  private lastPeakTime = 0;
  private readonly bufferSize = 10;
  private readonly minAmplitude = 0.1; // Reducido significativamente
  private readonly adaptiveRate = 0.15;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    
    if (now - this.lastPeakTime < this.minPeakDistance) {
      return false;
    }

    if (signalBuffer.length < 3) { // Reducido el requisito de buffer
      return false;
    }

    const recentValues = signalBuffer.slice(-this.bufferSize);
    const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const stdDev = Math.sqrt(
      recentValues.reduce((a, b) => a + Math.pow(b - avgValue, 2), 0) / recentValues.length
    );

    // Umbral adaptativo más sensible
    this.adaptiveThreshold = avgValue + (stdDev * 0.5); // Reducido el multiplicador

    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = currentValue > this.adaptiveThreshold && 
                                  currentValue > this.minAmplitude;
    const isLocalMaximum = currentValue > Math.max(...signalBuffer.slice(-2)); // Reducido el número de muestras

    if (hasSignificantAmplitude && isLocalMaximum) {
      const currentInterval = now - this.lastPeakTime;
      
      // Más permisivo con los intervalos
      if (currentInterval >= this.minPeakDistance) {
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

  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 3) return true; // Más permisivo

    const last3Values = [...signalBuffer.slice(-2), currentValue];
    
    // Criterios más simples
    const isRising = last3Values[2] > last3Values[1];
    const isPeak = currentValue > last3Values[1];
    
    return isRising && isPeak;
  }

  private validatePeakInterval(currentInterval: number): boolean {
    if (this.timeBuffer.length >= this.bufferSize) {
      this.timeBuffer.shift();
      this.peakBuffer.shift();
    }

    if (this.timeBuffer.length < 2) {
      return currentInterval >= this.minPeakDistance;
    }

    const sortedIntervals = [...this.timeBuffer].sort((a, b) => a - b);
    const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];

    // Mayor tolerancia en la variación del intervalo
    const maxVariation = 0.4; // Aumentado de 0.3
    const isWithinRange = Math.abs(currentInterval - medianInterval) <= medianInterval * maxVariation;

    return isWithinRange && currentInterval >= this.minPeakDistance;
  }

  private updatePeakHistory(peakValue: number, timestamp: number) {
    if (this.peakBuffer.length >= this.bufferSize) {
      this.peakBuffer.shift();
      this.timeBuffer.shift();
    }
    
    this.peakBuffer.push(peakValue);
    this.timeBuffer.push(timestamp);
  }

  getLastPeakTime(): number {
    return this.lastPeakTime;
  }
}
