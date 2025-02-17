
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 400; // Aumentado de 300 a 400ms
  private lastPeakTime = 0;
  private readonly bufferSize = 30;
  private readonly minAmplitude = 0.15; // Aumentado de 0.1 a 0.15
  private readonly adaptiveRate = 0.15; // Reducido de 0.2 a 0.15
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private readonly MAX_BPM = 180;
  private readonly MIN_BPM = 40;
  private readonly peakWindowSize = 5;
  private readonly minPeakProminence = 0.3;

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    
    const timeSinceLastPeak = now - this.lastPeakTime;
    const minTimeGap = (60 / this.MAX_BPM) * 1000;
    const maxTimeGap = (60 / this.MIN_BPM) * 1000;

    // Verificación más estricta del tiempo entre picos
    if (timeSinceLastPeak < minTimeGap) {
      return false;
    }

    if (signalBuffer.length < 8) {
      return false;
    }

    // Análisis de señal mejorado con ventana deslizante
    const recentValues = signalBuffer.slice(-this.bufferSize);
    const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    // Calcular desviación estándar con más precisión
    const positiveValues = recentValues.filter(v => v > 0);
    const stdDev = positiveValues.length > 0 ? 
      Math.sqrt(
        positiveValues.reduce((a, b) => a + Math.pow(b - avgValue, 2), 0) / positiveValues.length
      ) : 1;

    // Umbral adaptativo más robusto
    this.adaptiveThreshold = Math.abs(avgValue) + (stdDev * 1.2); // Factor aumentado de 0.5 a 1.2

    // Validaciones más estrictas
    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = Math.abs(currentValue) > this.adaptiveThreshold * 0.8; // Aumentado de 0.5 a 0.8
    const isLocalMaximum = this.isLocalMax(currentValue, signalBuffer);
    const hasProminence = this.checkPeakProminence(currentValue, signalBuffer);

    if (isLocalMaximum && hasSignificantAmplitude && isValidShape && hasProminence) {
      if (timeSinceLastPeak > maxTimeGap) {
        this.resetPeakDetection(now);
        return false;
      }

      const currentInterval = timeSinceLastPeak;
      const isValidInterval = this.validatePeakInterval(currentInterval);
      
      if (isValidInterval) {
        this.lastPeakTime = now;
        this.updatePeakHistory(currentValue, now);
        return true;
      }
    }

    return false;
  }

  private isLocalMax(currentValue: number, signalBuffer: number[]): boolean {
    const window = this.peakWindowSize;
    const recent = signalBuffer.slice(-window);
    return currentValue === Math.max(...recent);
  }

  private checkPeakProminence(currentValue: number, signalBuffer: number[]): boolean {
    const window = Math.min(15, signalBuffer.length);
    const segment = signalBuffer.slice(-window);
    const minValue = Math.min(...segment);
    const prominence = currentValue - minValue;
    return prominence > this.minPeakProminence;
  }

  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 6) return false;

    const last6Values = [...signalBuffer.slice(-5), currentValue];
    
    // Verificar tendencia creciente más estricta
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < last6Values.length; i++) {
      if (last6Values[i] > last6Values[i-1]) {
        increasing++;
      } else if (last6Values[i] < last6Values[i-1]) {
        decreasing++;
      }
    }
    
    // Requiere un patrón más claro de subida y bajada
    return increasing >= 3 && decreasing <= 2;
  }

  private validatePeakInterval(currentInterval: number): boolean {
    if (this.timeBuffer.length < 2) {
      return currentInterval >= this.minPeakDistance;
    }

    const recentIntervals = this.timeBuffer.slice(-3);
    const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    
    // Tolerancia más estricta a la variación
    const maxVariation = 0.3; // Reducido de 0.4 a 0.3
    const isWithinRange = Math.abs(currentInterval - avgInterval) <= avgInterval * maxVariation;
    const isPhysiologicallyValid = currentInterval >= this.minPeakDistance && 
                                  currentInterval <= (60 / this.MIN_BPM) * 1000;

    return isPhysiologicallyValid && isWithinRange;
  }

  private resetPeakDetection(now: number) {
    this.lastPeakTime = now;
    this.peakBuffer = [];
    this.timeBuffer = [];
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
