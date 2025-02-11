
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 500; // ms - mínimo tiempo entre latidos (120 BPM máximo)
  private lastPeakTime = 0;
  private readonly bufferSize = 10;
  private readonly minAmplitude = 0.2; // Reducido de 0.3
  private readonly adaptiveRate = 0.15;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    
    // Log más frecuente
    if (this.frameCount % 5 === 0) {
      console.log('Análisis de pico:', {
        currentValue,
        threshold: this.adaptiveThreshold,
        timeSinceLastPeak: now - this.lastPeakTime,
        bufferLength: signalBuffer.length,
        frameCount: this.frameCount
      });
    }

    if (now - this.lastPeakTime < this.minPeakDistance) {
      return false;
    }

    if (signalBuffer.length < 5) {
      console.log('Buffer insuficiente para análisis');
      return false;
    }

    const recentValues = signalBuffer.slice(-this.bufferSize);
    const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const stdDev = Math.sqrt(
      recentValues.reduce((a, b) => a + Math.pow(b - avgValue, 2), 0) / recentValues.length
    );

    // Umbral adaptativo más sensible
    this.adaptiveThreshold = avgValue + stdDev;

    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = currentValue > this.adaptiveThreshold && 
                                  currentValue > this.minAmplitude;
    const isLocalMaximum = currentValue > Math.max(...signalBuffer.slice(-3));

    if (hasSignificantAmplitude) {
      console.log('Validación de pico:', {
        isValidShape,
        hasSignificantAmplitude,
        isLocalMaximum,
        currentValue,
        threshold: this.adaptiveThreshold,
        avgValue,
        stdDev
      });
    }

    if (isValidShape && hasSignificantAmplitude && isLocalMaximum) {
      const currentInterval = now - this.lastPeakTime;
      const isValidInterval = this.validatePeakInterval(currentInterval);

      if (isValidInterval) {
        this.lastPeakTime = now;
        this.updatePeakHistory(currentValue, now);
        console.log('¡LATIDO DETECTADO!', {
          valor: currentValue,
          umbral: this.adaptiveThreshold,
          intervalo: currentInterval,
          bpmEstimado: 60000 / currentInterval
        });
        return true;
      } else {
        console.log('Intervalo inválido:', {
          currentInterval,
          minAllowed: this.minPeakDistance
        });
      }
    }

    return false;
  }

  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 5) return false;

    const last5Values = [...signalBuffer.slice(-4), currentValue];
    
    // Criterios más relajados para la forma del pico
    const isRising = last5Values[3] > last5Values[2] && 
                    last5Values[2] > last5Values[1];
    
    const isPeak = currentValue > last5Values[3];
    
    const leftSlope = (currentValue - last5Values[3]) / 1;
    const rightSlope = Math.abs((last5Values[3] - last5Values[2]) / 1);
    const isSimilarSlope = Math.abs(leftSlope - rightSlope) < 0.8; // Más tolerante

    return isRising && isPeak && isSimilarSlope;
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
