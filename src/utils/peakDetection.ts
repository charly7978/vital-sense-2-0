
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 200; // Reducido para mejor detección
  private lastPeakTime = 0;
  private readonly bufferSize = 15; // Reducido para respuesta más rápida
  private readonly minAmplitude = 0.003; // Reducido significativamente para máxima sensibilidad
  private readonly adaptiveRate = 0.3; // Aumentado para adaptación más rápida
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;
  private readonly maxBPM = 250; // Aumentado rango
  private readonly minBPM = 30;
  private lastPeakValues: number[] = [];
  private readonly peakMemory = 5;

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    
    const minInterval = (60000 / this.maxBPM);
    const timeSinceLastPeak = now - this.lastPeakTime;
    
    if (timeSinceLastPeak < minInterval) {
      return false;
    }

    if (signalBuffer.length < 3) { // Reducido requisito mínimo
      return false;
    }

    const recentValues = signalBuffer.slice(-this.bufferSize);
    const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const stdDev = Math.sqrt(
      recentValues.reduce((a, b) => a + Math.pow(b - avgValue, 2), 0) / recentValues.length
    );

    const trend = this.calculateTrend(recentValues);
    const detrended = currentValue - trend;

    // Mejorado el cálculo del umbral dinámico para mayor sensibilidad
    const dynamicThreshold = this.calculateDynamicThreshold(recentValues, avgValue, stdDev);
    this.adaptiveThreshold = (this.adaptiveThreshold * (1 - this.adaptiveRate)) + 
                            (dynamicThreshold * this.adaptiveRate);

    // Validaciones más permisivas para detección de picos
    const hasSignificantAmplitude = detrended > this.minAmplitude * stdDev;
    const isAboveThreshold = currentValue > (this.adaptiveThreshold * 0.6); // Reducido significativamente
    const isPotentialPeak = this.validatePeakCharacteristics(currentValue, signalBuffer, avgValue, stdDev);

    if ((hasSignificantAmplitude || isAboveThreshold) && isPotentialPeak) {
      const currentInterval = now - this.lastPeakTime;
      
      if (this.validatePeakTiming(currentInterval)) {
        this.lastPeakTime = now;
        this.updatePeakHistory(currentValue, now);
        
        const bpm = 60000 / currentInterval;
        const confidence = this.calculateConfidence(currentValue, avgValue, stdDev, currentInterval);
        
        console.log('Detección de latido:', {
          valor: currentValue.toFixed(3),
          umbral: this.adaptiveThreshold.toFixed(3),
          tendencia: trend.toFixed(3),
          detrendizado: detrended.toFixed(3),
          intervalo: currentInterval.toFixed(0),
          bpm: bpm.toFixed(1),
          confianza: (confidence * 100).toFixed(1) + '%'
        });
        
        return true;
      }
    }

    return false;
  }

  private calculateTrend(values: number[]): number {
    const n = values.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += values[i];
      sumXY += i * values[i];
      sumXX += i * i;
    }
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    return slope * (n - 1) + intercept;
  }

  private calculateDynamicThreshold(values: number[], mean: number, stdDev: number): number {
    const skewness = this.calculateSkewness(values, mean, stdDev);
    const kurtosis = this.calculateKurtosis(values, mean, stdDev);
    
    // Ajustado para mayor sensibilidad
    const thresholdFactor = 0.25 + 
                           Math.abs(skewness) * 0.05 + 
                           Math.max(0, kurtosis - 3) * 0.02;
    
    return mean + thresholdFactor * stdDev;
  }

  private calculateSkewness(values: number[], mean: number, stdDev: number): number {
    const n = values.length;
    const m3 = values.reduce((acc, val) => acc + Math.pow(val - mean, 3), 0) / n;
    return m3 / Math.pow(stdDev, 3);
  }

  private calculateKurtosis(values: number[], mean: number, stdDev: number): number {
    const n = values.length;
    const m4 = values.reduce((acc, val) => acc + Math.pow(val - mean, 4), 0) / n;
    return m4 / Math.pow(stdDev, 4);
  }

  private validatePeakCharacteristics(currentValue: number, signalBuffer: number[], mean: number, stdDev: number): boolean {
    const window = 3; // Reducido de 4
    const samples = signalBuffer.slice(-window);
    
    const firstDerivative = samples.map((v, i, arr) => i > 0 ? v - arr[i-1] : 0);
    const secondDerivative = firstDerivative.map((v, i, arr) => i > 0 ? v - arr[i-1] : 0);
    
    // Criterios más permisivos
    const isRising = firstDerivative[firstDerivative.length - 2] > -0.15;
    const isPeaking = firstDerivative[firstDerivative.length - 1] < 0.15;
    const isConcaveDown = secondDerivative[secondDerivative.length - 1] < 0.15;
    
    const relativeAmplitude = (currentValue - mean) / stdDev;
    const isSignificant = relativeAmplitude > this.minAmplitude;
    
    return (isRising && isPeaking) || (isConcaveDown && isSignificant);
  }

  private validatePeakTiming(currentInterval: number): boolean {
    const maxInterval = (60000 / this.minBPM);
    const minInterval = (60000 / this.maxBPM);
    
    if (currentInterval < minInterval || currentInterval > maxInterval) {
      return false;
    }

    if (this.timeBuffer.length >= 3) {
      const recentIntervals = this.timeBuffer.slice(-3)
        .map((t, i, arr) => i > 0 ? t - arr[i-1] : 0)
        .filter(i => i > 0);
      
      const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
      const variability = recentIntervals.reduce((acc, interval) => 
        acc + Math.pow(interval - avgInterval, 2), 0) / recentIntervals.length;
      
      // Aumentado el rango de variación permitido
      const allowedVariation = Math.min(0.6, 0.5 + variability / avgInterval);
      
      return Math.abs(currentInterval - avgInterval) <= avgInterval * allowedVariation;
    }
    
    return true;
  }

  private calculateConfidence(value: number, mean: number, stdDev: number, interval: number): number {
    const amplitudeConfidence = Math.min(1, (value - mean) / (2.5 * stdDev)); // Reducido de 3 a 2.5
    const timingConfidence = this.calculateTimingConfidence(interval);
    const shapeConfidence = this.calculateShapeConfidence();
    
    return (amplitudeConfidence + timingConfidence + shapeConfidence) / 3;
  }

  private calculateTimingConfidence(currentInterval: number): number {
    if (this.timeBuffer.length < 2) return 0.5;
    
    const intervals = this.timeBuffer.slice(-3)
      .map((t, i, arr) => i > 0 ? t - arr[i-1] : 0)
      .filter(i => i > 0);
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const deviation = Math.abs(currentInterval - avgInterval) / avgInterval;
    
    return Math.max(0, 1 - deviation);
  }

  private calculateShapeConfidence(): number {
    if (this.lastPeakValues.length < 2) return 0.5;
    
    const variations = this.lastPeakValues.slice(1)
      .map((v, i) => Math.abs(v - this.lastPeakValues[i]) / this.lastPeakValues[i]);
    
    return Math.max(0, 1 - variations.reduce((a, b) => a + b, 0) / variations.length);
  }

  private updatePeakHistory(peakValue: number, timestamp: number) {
    if (this.peakBuffer.length >= this.bufferSize) {
      this.peakBuffer.shift();
      this.timeBuffer.shift();
    }
    
    this.peakBuffer.push(peakValue);
    this.timeBuffer.push(timestamp);
    
    this.lastPeakValues.push(peakValue);
    if (this.lastPeakValues.length > this.peakMemory) {
      this.lastPeakValues.shift();
    }

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
        muestras: this.peakBuffer.length,
        historialPicos: this.lastPeakValues.length
      });
    }
  }

  getLastPeakTime(): number {
    return this.lastPeakTime;
  }
}
