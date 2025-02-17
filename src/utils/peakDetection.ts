export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 400;
  private lastPeakTime = 0;
  private readonly bufferSize = 30;
  private readonly minAmplitude = 0.15;
  private readonly adaptiveRate = 0.15;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private readonly MAX_BPM = 180;
  private readonly MIN_BPM = 40;
  private readonly peakWindowSize = 5;
  private readonly minPeakProminence = 0.2;
  private readonly minSignalStrength = 0.08;
  private frameCount = 0;

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    
    if (Math.abs(currentValue) < this.minSignalStrength) {
      console.log('Señal muy débil:', currentValue);
      return false;
    }
    
    const timeSinceLastPeak = now - this.lastPeakTime;
    const minTimeGap = (60 / this.MAX_BPM) * 1000;
    const maxTimeGap = (60 / this.MIN_BPM) * 1000;

    if (timeSinceLastPeak < minTimeGap) {
      return false;
    }

    if (signalBuffer.length < 8) {
      console.log('Buffer insuficiente:', signalBuffer.length);
      return false;
    }

    const recentValues = signalBuffer.slice(-this.bufferSize);
    const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    
    const positiveValues = recentValues.filter(v => v > 0);
    const stdDev = positiveValues.length > 0 ? 
      Math.sqrt(
        positiveValues.reduce((a, b) => a + Math.pow(b - avgValue, 2), 0) / positiveValues.length
      ) : 1;

    this.adaptiveThreshold = Math.abs(avgValue) + (stdDev * 1.1);

    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = Math.abs(currentValue) > this.adaptiveThreshold * 0.7;
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
        console.log('✓ Pico válido detectado:', {
          valor: currentValue,
          tiempo: now,
          intervalo: currentInterval,
          amplitud: Math.abs(currentValue),
          umbral: this.adaptiveThreshold
        });
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
    
    let increasing = 0;
    let decreasing = 0;
    
    for (let i = 1; i < last6Values.length; i++) {
      if (last6Values[i] > last6Values[i-1]) {
        increasing++;
      } else if (last6Values[i] < last6Values[i-1]) {
        decreasing++;
      }
    }
    
    return increasing >= 3 && decreasing <= 2;
  }

  private validatePeakInterval(currentInterval: number): boolean {
    if (this.timeBuffer.length < 2) {
      return currentInterval >= this.minPeakDistance;
    }

    const recentIntervals = this.timeBuffer.slice(-3);
    const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    
    const maxVariation = 0.3;
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

  getFrameCount(): number {
    return this.frameCount;
  }
}
