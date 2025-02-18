// src/lib/SignalFilter.ts

import { SignalQualityLevel, Percentage, SystemConfig } from '@/types';

export class SignalFilter {
  private readonly sampleRate: number;
  private readonly config: SystemConfig['filtering'];
  
  // Filtro Kalman adaptativo
  private readonly kalmanState = {
    x: 0,          // Estado estimado
    p: 1,          // Covarianza estimada
    q: 0.15,       // Ruido del proceso
    r: 0.8,        // Ruido de medición
    adaptiveR: true // Adaptación automática del ruido
  };

  // Coeficientes Butterworth optimizados
  private readonly butterworthCoefficients = {
    // Coeficientes para 30Hz optimizados para PPG
    a: [1.0000, -1.5164, 0.5321],
    b: [0.0079, 0.0158, 0.0079]
  };

  // Buffers circulares para mejor rendimiento
  private readonly bufferSize = 3;
  private readonly xBuffer: Float32Array;
  private readonly yBuffer: Float32Array;
  
  // Ventana móvil para análisis
  private readonly windowSize = 128;
  private readonly signalWindow: Float32Array;
  private windowIndex = 0;

  constructor(sampleRate: number = 30) {
    this.sampleRate = sampleRate;
    this.xBuffer = new Float32Array(this.bufferSize);
    this.yBuffer = new Float32Array(this.bufferSize);
    this.signalWindow = new Float32Array(this.windowSize);
    this.initializeFilters();
  }

  private initializeFilters(): void {
    // Inicialización de buffers
    this.xBuffer.fill(0);
    this.yBuffer.fill(0);
    this.signalWindow.fill(0);

    // Cálculo de coeficientes basados en la frecuencia de muestreo
    this.updateButterworthCoefficients();
  }

  private updateButterworthCoefficients(): void {
    const f1 = 0.5;  // Frecuencia de corte inferior (Hz)
    const f2 = 4.0;  // Frecuencia de corte superior (Hz)
    
    // Transformación bilineal
    const w1 = 2 * Math.PI * f1 / this.sampleRate;
    const w2 = 2 * Math.PI * f2 / this.sampleRate;
    
    // Actualizar coeficientes basados en las frecuencias normalizadas
    // ... (cálculos complejos de coeficientes)
  }

  public filter(signal: Float32Array): Float32Array {
    const filtered = new Float32Array(signal.length);
    let quality = SignalQualityLevel.Excellent;

    // Análisis de calidad de señal pre-filtrado
    const preFilterQuality = this.analyzeSignalQuality(signal);
    if (preFilterQuality < 0.3) {
      quality = SignalQualityLevel.Poor;
    }

    // Pipeline de filtrado
    const detrended = this.removeTrend(signal);
    const outliersCleaned = this.removeOutliers(detrended);
    const bandPassFiltered = this.bandPassFilter(outliersCleaned);
    const kalmanFiltered = this.applyKalmanFilter(bandPassFiltered);
    const smoothed = this.smoothSignal(kalmanFiltered);

    // Normalización adaptativa
    return this.normalizeSignal(smoothed);
  }

  private removeTrend(signal: Float32Array): Float32Array {
    const detrended = new Float32Array(signal.length);
    const windowSize = Math.min(30, Math.floor(signal.length / 3));
    
    for (let i = 0; i < signal.length; i++) {
      const start = Math.max(0, i - windowSize);
      const end = Math.min(signal.length, i + windowSize + 1);
      let sum = 0;
      
      for (let j = start; j < end; j++) {
        sum += signal[j];
      }
      
      const trend = sum / (end - start);
      detrended[i] = signal[i] - trend;
    }
    
    return detrended;
  }

  private removeOutliers(signal: Float32Array): Float32Array {
    const cleaned = new Float32Array(signal.length);
    const { mean, stdDev } = this.calculateStats(signal);
    const threshold = 2.5; // Umbral de desviaciones estándar
    
    for (let i = 0; i < signal.length; i++) {
      if (Math.abs(signal[i] - mean) > threshold * stdDev) {
        // Interpolación para outliers
        cleaned[i] = i > 0 ? cleaned[i-1] : mean;
      } else {
        cleaned[i] = signal[i];
      }
    }
    
    return cleaned;
  }

  private bandPassFilter(signal: Float32Array): Float32Array {
    const filtered = new Float32Array(signal.length);
    
    for (let i = 0; i < signal.length; i++) {
      // Actualizar buffer circular
      this.updateBuffers(signal[i]);
      
      // Aplicar filtro IIR
      filtered[i] = this.applyIIRFilter();
    }
    
    return filtered;
  }

  private applyKalmanFilter(signal: Float32Array): Float32Array {
    const filtered = new Float32Array(signal.length);
    
    for (let i = 0; i < signal.length; i++) {
      // Predicción
      const predictedState = this.kalmanState.x;
      const predictedCovariance = this.kalmanState.p + this.kalmanState.q;
      
      // Actualización
      const innovation = signal[i] - predictedState;
      const innovationCovariance = predictedCovariance + this.kalmanState.r;
      
      // Ganancia de Kalman adaptativa
      const kalmanGain = predictedCovariance / innovationCovariance;
      
      // Actualización de estado
      this.kalmanState.x = predictedState + kalmanGain * innovation;
      this.kalmanState.p = (1 - kalmanGain) * predictedCovariance;
      
      // Adaptación del ruido de medición
      if (this.kalmanState.adaptiveR) {
        this.kalmanState.r = Math.max(0.1, Math.abs(innovation));
      }
      
      filtered[i] = this.kalmanState.x;
    }
    
    return filtered;
  }

  private smoothSignal(signal: Float32Array): Float32Array {
    const smoothed = new Float32Array(signal.length);
    const windowSize = 5;
    const weights = new Float32Array(windowSize);
    
    // Gaussian weights
    for (let i = 0; i < windowSize; i++) {
      const x = (i - (windowSize-1)/2) / ((windowSize-1)/4);
      weights[i] = Math.exp(-0.5 * x * x);
    }
    
    // Normalize weights
    const weightSum = weights.reduce((a, b) => a + b, 0);
    for (let i = 0; i < windowSize; i++) {
      weights[i] /= weightSum;
    }
    
    // Apply weighted moving average
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let totalWeight = 0;
      
      for (let j = 0; j < windowSize; j++) {
        const idx = i + j - Math.floor(windowSize/2);
        if (idx >= 0 && idx < signal.length) {
          sum += signal[idx] * weights[j];
          totalWeight += weights[j];
        }
      }
      
      smoothed[i] = sum / totalWeight;
    }
    
    return smoothed;
  }

  private normalizeSignal(signal: Float32Array): Float32Array {
    const normalized = new Float32Array(signal.length);
    const { mean, stdDev } = this.calculateStats(signal);
    
    if (stdDev === 0) return normalized;
    
    for (let i = 0; i < signal.length; i++) {
      normalized[i] = (signal[i] - mean) / stdDev;
    }
    
    return normalized;
  }

  private calculateStats(signal: Float32Array): { mean: number; stdDev: number } {
    let sum = 0;
    let sumSq = 0;
    
    for (let i = 0; i < signal.length; i++) {
      sum += signal[i];
      sumSq += signal[i] * signal[i];
    }
    
    const mean = sum / signal.length;
    const variance = (sumSq / signal.length) - (mean * mean);
    const stdDev = Math.sqrt(Math.max(0, variance));
    
    return { mean, stdDev };
  }

  private analyzeSignalQuality(signal: Float32Array): number {
    const { mean, stdDev } = this.calculateStats(signal);
    const snr = this.calculateSNR(signal);
    const stability = this.calculateStability(signal);
    
    // Ponderación de factores de calidad
    return (
      0.4 * Math.min(1, snr / 10) +
      0.3 * stability +
      0.3 * Math.min(1, stdDev / mean)
    );
  }

  private calculateSNR(signal: Float32Array): number {
    const { mean } = this.calculateStats(signal);
    let signalPower = 0;
    let noisePower = 0;
    
    for (let i = 1; i < signal.length; i++) {
      const trend = (signal[i] + signal[i-1]) / 2;
      signalPower += (trend - mean) ** 2;
      noisePower += (signal[i] - trend) ** 2;
    }
    
    return noisePower === 0 ? 0 : 10 * Math.log10(signalPower / noisePower);
  }

  private calculateStability(signal: Float32Array): number {
    let totalVariation = 0;
    
    for (let i = 1; i < signal.length; i++) {
      totalVariation += Math.abs(signal[i] - signal[i-1]);
    }
    
    const averageVariation = totalVariation / (signal.length - 1);
    return Math.exp(-averageVariation);
  }

  // Métodos para procesamiento en tiempo real
  public processRealTimeSignal(value: number): number {
    // Actualizar ventana móvil
    this.signalWindow[this.windowIndex] = value;
    this.windowIndex = (this.windowIndex + 1) % this.windowSize;
    
    // Aplicar pipeline de filtrado
    const filtered = this.filter(this.getCurrentWindow());
    return filtered[filtered.length - 1];
  }

  private getCurrentWindow(): Float32Array {
    const window = new Float32Array(this.windowSize);
    for (let i = 0; i < this.windowSize; i++) {
      window[i] = this.signalWindow[(this.windowIndex + i) % this.windowSize];
    }
    return window;
  }
}
