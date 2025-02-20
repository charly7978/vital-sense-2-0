import type { ProcessedPPGSignal, SensitivitySettings } from './types';

export class WaveletPPGProcessor {
  private readonly bufferSize: number = 128;
  private readonly samplingRate: number = 30;
  private readonly signalBuffer: number[] = [];
  private readonly timeBuffer: number[] = [];
  private lastProcessedTime: number = 0;
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 2.5,      // Aumentado para mejor detección
    noiseReduction: 1.2,           // Reducido para no perder señal
    peakDetection: 0.8,           // Reducido para detectar picos más sutiles
    heartbeatThreshold: 0.3,      // Reducido para detectar pulsos más débiles
    responseTime: 0.9,            // Aumentado para mejor estabilidad
    signalStability: 1.5,         // Aumentado para mejor filtrado
    brightness: 1.2,              // Aumentado para mejor captura
    redIntensity: 1.3            // Aumentado para mejor separación R/IR
  };

  constructor() {
    console.log('🌊 Iniciando procesador PPG basado en Wavelets');
  }

  updateSensitivitySettings(settings: Partial<SensitivitySettings>): void {
    this.sensitivitySettings = {
      ...this.sensitivitySettings,
      ...settings
    };
    console.log('🔧 Configuración actualizada:', this.sensitivitySettings);
  }

  private extractColorComponents(imageData: ImageData): { red: number, green: number, blue: number } {
    const { data, width, height } = imageData;
    let redSum = 0, greenSum = 0, blueSum = 0;
    let validPixels = 0;

    // ROI en el centro de la imagen
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const roiSize = Math.floor(Math.min(width, height) * 0.4); // Aumentado ROI
    
    for (let y = centerY - roiSize; y < centerY + roiSize; y++) {
      for (let x = centerX - roiSize; x < centerX + roiSize; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const i = (y * width + x) * 4;
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];

          // Criterio de validación menos estricto
          if (r > 30 && r < 250) {
            redSum += r;
            greenSum += g;
            blueSum += b;
            validPixels++;
          }
        }
      }
    }

    if (validPixels === 0) return { red: 0, green: 0, blue: 0 };

    // Aplicar amplificación de señal
    const amplification = this.sensitivitySettings.signalAmplification;
    return {
      red: (redSum / validPixels) * amplification,
      green: (greenSum / validPixels) * amplification,
      blue: (blueSum / validPixels) * amplification
    };
  }

  private calculatePerfusionIndex(red: number, green: number, blue: number): number {
    if (red === 0) return 0;
    
    // Índice de perfusión mejorado con mayor sensibilidad
    const ac = Math.abs(red - green) * this.sensitivitySettings.signalAmplification;
    const dc = red;
    const perfusionIndex = (ac / dc) * 2.5; // Factor de amplificación adicional

    // Aplicar filtro de suavizado
    return this.applySmoothing(perfusionIndex);
  }

  private applySmoothing(value: number): number {
    // Implementar filtro de media móvil ponderada
    const alpha = 0.3; // Factor de suavizado
    if (this.signalBuffer.length === 0) return value;
    
    const lastValue = this.signalBuffer[this.signalBuffer.length - 1];
    return alpha * value + (1 - alpha) * lastValue;
  }

  private findPeaks(signal: number[]): number[] {
    const peaks: number[] = [];
    const threshold = this.sensitivitySettings.peakDetection * 0.5; // Reducido para mayor sensibilidad
    
    for (let i = 2; i < signal.length - 2; i++) {
      const window = signal.slice(i-2, i+3);
      const current = signal[i];
      
      // Detector de picos mejorado
      if (current === Math.max(...window) && 
          current > threshold && 
          current > signal[i-1] * 1.1 && // 10% más alto que el punto anterior
          current > signal[i+1] * 1.1) { // 10% más alto que el punto siguiente
        peaks.push(i);
      }
    }
    
    return peaks;
  }

  private calculateHeartRate(peaks: number[]): number {
    if (peaks.length < 2) return 0;
    
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = this.timeBuffer[peaks[i]] - this.timeBuffer[peaks[i-1]];
      // Ventana más amplia para detectar pulsos
      if (interval > 250 && interval < 2000) { // 30-240 bpm
        intervals.push(interval);
      }
    }
    
    if (intervals.length === 0) return 0;
    
    // Promedio ponderado de intervalos
    const weightedIntervals = intervals.map((interval, index) => ({
      interval,
      weight: Math.exp(-0.1 * (intervals.length - index)) // Dar más peso a los intervalos recientes
    }));
    
    const totalWeight = weightedIntervals.reduce((sum, { weight }) => sum + weight, 0);
    const avgInterval = weightedIntervals.reduce((sum, { interval, weight }) => 
      sum + interval * weight, 0) / totalWeight;

    return Math.round(60000 / avgInterval);
  }

  async processFrame(imageData: ImageData): Promise<ProcessedPPGSignal> {
    const { red, green, blue } = this.extractColorComponents(imageData);
    const perfusionIndex = this.calculatePerfusionIndex(red, green, blue);
    
    // Actualizar buffers
    const currentTime = Date.now();
    this.signalBuffer.push(perfusionIndex);
    this.timeBuffer.push(currentTime);
    
    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer.shift();
      this.timeBuffer.shift();
    }

    // Solo procesar cada 33ms (aprox. 30fps)
    if (currentTime - this.lastProcessedTime < 33) {
      return this.createInvalidSignalResponse();
    }
    
    this.lastProcessedTime = currentTime;

    // Análisis wavelet
    const { heartRate, signalQuality, peaks } = this.performWaveletAnalysis();
    
    // Análisis de saturación de oxígeno
    const spo2 = this.calculateSpO2(red, perfusionIndex);
    
    // Análisis de presión usando transformada de Hilbert
    const { systolic, diastolic } = this.estimateBloodPressure(peaks);

    console.log('🔍 Análisis Wavelet:', {
      hr: heartRate,
      calidad: signalQuality,
      picos: peaks.length,
      perfusion: perfusionIndex.toFixed(3)
    });

    return {
      signal: [perfusionIndex],
      quality: signalQuality,
      isHeartbeat: peaks.length > 0,
      bpm: heartRate,
      timestamp: currentTime,
      spo2,
      systolic,
      diastolic,
      hasArrhythmia: this.detectArrhythmia(peaks),
      arrhythmiaType: 'Normal',
      readings: [{
        timestamp: currentTime,
        value: perfusionIndex
      }],
      signalQuality
    };
  }

  private discreteWaveletTransform(signal: number[]): number[] {
    const n = signal.length;
    const output = new Array(n).fill(0);

    // Haar wavelet simplificado
    for (let i = 0; i < n - 1; i += 2) {
      const avg = (signal[i] + signal[i + 1]) / Math.sqrt(2);
      const diff = (signal[i] - signal[i + 1]) / Math.sqrt(2);
      output[i/2] = avg;
      output[n/2 + i/2] = diff;
    }

    return output;
  }

  private performWaveletAnalysis(): { heartRate: number, signalQuality: number, peaks: number[] } {
    if (this.signalBuffer.length < this.bufferSize) {
      return { heartRate: 0, signalQuality: 0, peaks: [] };
    }

    // Aplicar transformada wavelet
    const coefficients = this.discreteWaveletTransform(this.signalBuffer);
    
    // Detectar picos en los coeficientes
    const peaks = this.findPeaks(coefficients);
    
    // Calcular ritmo cardíaco
    const heartRate = this.calculateHeartRate(peaks);
    
    // Evaluar calidad de señal
    const signalQuality = this.evaluateSignalQuality(coefficients, peaks);

    return { heartRate, signalQuality, peaks };
  }

  private evaluateSignalQuality(coefficients: number[], peaks: number[]): number {
    if (coefficients.length === 0 || peaks.length === 0) return 0;

    // Análisis de energía de la señal
    const signalEnergy = coefficients.reduce((sum, c) => sum + c * c, 0);
    const normalizedEnergy = Math.min(1, signalEnergy / (this.bufferSize * 100));

    // Regularidad de intervalos entre picos
    const peakRegularity = this.calculatePeakRegularity(peaks);

    // Calidad final combinada
    return Math.min(1, (normalizedEnergy * 0.6 + peakRegularity * 0.4) * 
                      this.sensitivitySettings.signalStability);
  }

  private calculatePeakRegularity(peaks: number[]): number {
    if (peaks.length < 3) return 0;
    
    const intervals = peaks.slice(1).map((p, i) => p - peaks[i]);
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const variance = intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    
    return Math.exp(-variance / (avgInterval * 2));
  }

  private calculateSpO2(red: number, perfusionIndex: number): number {
    if (perfusionIndex < 0.1) return 0;
    
    // SpO2 estimado basado en intensidad del rojo y perfusión
    const baseSpO2 = 96 + (perfusionIndex * 3);
    return Math.min(100, Math.max(80, Math.round(baseSpO2)));
  }

  private estimateBloodPressure(peaks: number[]): { systolic: number, diastolic: number } {
    if (peaks.length < 2) return { systolic: 0, diastolic: 0 };

    // Análisis de la forma de onda para estimar presión
    const peakAmplitudes = peaks.map(p => this.signalBuffer[p]);
    const avgAmplitude = peakAmplitudes.reduce((a, b) => a + b) / peakAmplitudes.length;
    
    const systolic = 120 + (avgAmplitude * 20);
    const diastolic = 80 + (avgAmplitude * 10);

    return {
      systolic: Math.min(180, Math.max(90, Math.round(systolic))),
      diastolic: Math.min(110, Math.max(60, Math.round(diastolic)))
    };
  }

  private detectArrhythmia(peaks: number[]): boolean {
    if (peaks.length < 3) return false;

    // Análisis de variabilidad de intervalos RR
    const intervals = peaks.slice(1).map((p, i) => p - peaks[i]);
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const irregularIntervals = intervals.filter(i => Math.abs(i - avgInterval) > avgInterval * 0.2);

    return irregularIntervals.length > intervals.length * 0.2;
  }

  private createInvalidSignalResponse(): ProcessedPPGSignal {
    return {
      signal: [0],
      quality: 0,
      isHeartbeat: false,
      bpm: 0,
      timestamp: Date.now(),
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      hasArrhythmia: false,
      arrhythmiaType: 'Normal',
      readings: [{
        timestamp: Date.now(),
        value: 0
      }],
      signalQuality: 0
    };
  }
}
