
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 250; // Mantenemos este valor para evitar falsos positivos
  private lastPeakTime = 0;
  private readonly bufferSize = 20;
  private readonly minAmplitude = 0.06; // Reducido aún más para detectar picos más suaves
  private readonly adaptiveRate = 0.15;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;
  private readonly maxBPM = 180;
  private readonly minBPM = 40;

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    
    const minInterval = (60000 / this.maxBPM);
    const timeSinceLastPeak = now - this.lastPeakTime;
    
    if (timeSinceLastPeak < minInterval) {
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

    // Umbral adaptativo aún más sensible pero con protección contra ruido
    this.adaptiveThreshold = avgValue + (stdDev * 0.5); // Reducido para mayor sensibilidad

    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = currentValue > this.adaptiveThreshold && 
                                  currentValue > avgValue + (this.minAmplitude * stdDev);
    const isLocalMaximum = this.isLocalMax(currentValue, signalBuffer);

    if (hasSignificantAmplitude && isLocalMaximum && isValidShape) {
      const currentInterval = now - this.lastPeakTime;
      
      if (this.validatePeakInterval(currentInterval)) {
        this.lastPeakTime = now;
        this.updatePeakHistory(currentValue, now);
        
        const bpm = 60000 / currentInterval;
        console.log('Detección de latido:', {
          valor: currentValue.toFixed(3),
          umbral: this.adaptiveThreshold.toFixed(3),
          intervalo: currentInterval.toFixed(0),
          bpm: bpm.toFixed(1),
          amplitud: (currentValue - avgValue).toFixed(3),
          calidad: isValidShape ? 'Alta' : 'Media'
        });
        
        return true;
      }
    }

    return false;
  }

  private isLocalMax(currentValue: number, signalBuffer: number[]): boolean {
    const window = 3;
    const recent = signalBuffer.slice(-window);
    const localMax = Math.max(...recent);
    // Añadimos una tolerancia pequeña para detectar picos casi máximos
    const tolerance = 0.02;
    return (currentValue >= localMax * (1 - tolerance)) && currentValue > recent[recent.length - 2];
  }

  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 5) return false;

    const samples = [...signalBuffer.slice(-4), currentValue];
    
    // Análisis más detallado de la forma del pico
    const firstDerivative = samples.slice(1).map((v, i) => v - samples[i]);
    
    // Verificación más sensible del ascenso
    const isRising = firstDerivative[2] > 0 || 
                    (firstDerivative[2] > -0.05 && firstDerivative[1] > 0); // Tolerancia para ascensos suaves
    
    const isPeaking = firstDerivative[3] < 0;
    
    // Verificación de simetría más flexible pero aún controlada
    const symmetry = Math.abs(firstDerivative[2]) / Math.abs(firstDerivative[3]);
    const isSymmetric = symmetry > 0.3 && symmetry < 3.0; // Rango más amplio pero con límites
    
    return isRising && isPeaking && isSymmetric;
  }

  private validatePeakInterval(currentInterval: number): boolean {
    const maxInterval = (60000 / this.minBPM);
    const minInterval = (60000 / this.maxBPM);
    
    if (currentInterval < minInterval || currentInterval > maxInterval) {
      return false;
    }

    if (this.timeBuffer.length < 2) {
      return true;
    }

    const recentIntervals = this.timeBuffer.slice(-3)
      .map((t, i, arr) => i > 0 ? t - arr[i-1] : 0)
      .filter(i => i > 0);
    
    if (recentIntervals.length === 0) return true;
    
    const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    const maxVariation = 0.35; // Aumentado ligeramente para permitir más variabilidad natural
    
    // Verificación adicional para variaciones graduales
    const isGradualChange = Math.abs(currentInterval - this.timeBuffer[this.timeBuffer.length - 1]) < avgInterval * 0.4;
    
    return (Math.abs(currentInterval - avgInterval) <= avgInterval * maxVariation) || isGradualChange;
  }

  private updatePeakHistory(peakValue: number, timestamp: number) {
    if (this.peakBuffer.length >= this.bufferSize) {
      this.peakBuffer.shift();
      this.timeBuffer.shift();
    }
    
    this.peakBuffer.push(peakValue);
    this.timeBuffer.push(timestamp);

    if (this.timeBuffer.length > 2) {
      const intervals = this.timeBuffer.slice(1).map((t, i) => t - this.timeBuffer[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = 60000 / avgInterval;
      
      const variabilityValue = Math.sqrt(
        intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length
      ) / avgInterval;
      
      console.log('Análisis de ritmo cardíaco:', {
        bpm: bpm.toFixed(1),
        variabilidad: (variabilityValue * 100).toFixed(1) + '%',
        confianza: ((1 - variabilityValue) * 100).toFixed(1) + '%',
        muestras: this.peakBuffer.length
      });
    }
  }

  getLastPeakTime(): number {
    return this.lastPeakTime;
  }
}
