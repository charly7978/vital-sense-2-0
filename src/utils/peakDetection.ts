
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 500; // ms - mínimo tiempo entre latidos (120 BPM máximo)
  private lastPeakTime = 0;
  private readonly bufferSize = 10;
  private readonly minAmplitude = 0.3;
  private readonly adaptiveRate = 0.15;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    if (now - this.lastPeakTime < this.minPeakDistance) {
      return false;
    }

    if (signalBuffer.length < 5) {
      return false;
    }

    // Actualizar el umbral adaptativo
    const recentValues = signalBuffer.slice(-this.bufferSize);
    const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const stdDev = Math.sqrt(
      recentValues.reduce((a, b) => a + Math.pow(b - avgValue, 2), 0) / recentValues.length
    );

    this.adaptiveThreshold = avgValue + stdDev * 1.5;

    // Verificar si es un pico genuino usando análisis de forma
    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = currentValue > this.adaptiveThreshold && 
                                  currentValue > this.minAmplitude;
    const isLocalMaximum = currentValue > Math.max(...signalBuffer.slice(-3));

    if (isValidShape && hasSignificantAmplitude && isLocalMaximum) {
      // Verificar consistencia temporal
      const currentInterval = now - this.lastPeakTime;
      const isValidInterval = this.validatePeakInterval(currentInterval);

      if (isValidInterval) {
        this.lastPeakTime = now;
        this.updatePeakHistory(currentValue, now);
        console.log('Latido detectado:', {
          valor: currentValue,
          umbral: this.adaptiveThreshold,
          intervalo: currentInterval
        });
        return true;
      }
    }

    return false;
  }

  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 5) return false;

    const last5Values = [...signalBuffer.slice(-4), currentValue];
    
    // Verificar pendiente ascendente
    const isRising = last5Values[3] > last5Values[2] && 
                    last5Values[2] > last5Values[1];
    
    // Verificar que el pico actual es el más alto
    const isPeak = currentValue > last5Values[3];
    
    // Calcular simetría alrededor del pico potencial
    const leftSlope = (currentValue - last5Values[3]) / 1;
    const rightSlope = Math.abs((last5Values[3] - last5Values[2]) / 1);
    const isSimilarSlope = Math.abs(leftSlope - rightSlope) < 0.5;

    return isRising && isPeak && isSimilarSlope;
  }

  private validatePeakInterval(currentInterval: number): boolean {
    // Mantener historial de intervalos
    if (this.timeBuffer.length >= this.bufferSize) {
      this.timeBuffer.shift();
      this.peakBuffer.shift();
    }

    if (this.timeBuffer.length < 2) {
      return currentInterval >= this.minPeakDistance;
    }

    // Calcular la mediana de los intervalos anteriores
    const sortedIntervals = [...this.timeBuffer].sort((a, b) => a - b);
    const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];

    // Permitir una variación del 30% respecto a la mediana
    const maxVariation = 0.3;
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
