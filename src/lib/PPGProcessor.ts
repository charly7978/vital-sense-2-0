
import type { PPGData, SensitivitySettings } from '@/types';

export class PPGProcessor {
  private settings: SensitivitySettings;
  private buffer: number[] = [];
  private readonly bufferSize = 180;  // 6 segundos a 30fps
  private lastProcessedTime: number = 0;

  constructor() {
    this.settings = {
      signalAmplification: 1.2,
      noiseReduction: 1.5,
      peakDetection: 1.1,
      heartbeatThreshold: 0.7,
      responseTime: 1.2,
      signalStability: 0.7,
      brightness: 0.8,
      redIntensity: 1.2
    };
  }

  public async processFrame(imageData: ImageData): Promise<PPGData | null> {
    try {
      const now = Date.now();
      
      // Control de frecuencia de muestreo
      if (now - this.lastProcessedTime < 33) { // ~30fps
        return null;
      }
      
      // Extraer valor rojo promedio de la región central
      const redValue = this.extractRedValue(imageData);
      
      // Actualizar buffer
      this.updateBuffer(redValue);
      
      // Detectar pico
      const isPeak = this.detectPeak(redValue);
      
      // Calcular calidad de señal
      const quality = this.calculateSignalQuality();
      
      // Calcular BPM
      const bpm = this.calculateBPM();
      
      // Calcular SpO2
      const spo2 = this.calculateSpO2(imageData);
      
      // Calcular presión arterial estimada
      const { systolic, diastolic } = this.estimateBloodPressure();
      
      // Análisis de arritmia
      const { hasArrhythmia, arrhythmiaType } = this.analyzeArrhythmia();

      this.lastProcessedTime = now;

      return {
        bpm,
        spo2,
        systolic,
        diastolic,
        hasArrhythmia,
        arrhythmiaType,
        confidence: quality,
        readings: [],
        isPeak,
        signalQuality: quality,
        timestamp: now,
        value: redValue
      };

    } catch (error) {
      console.error('Error procesando frame:', error);
      return null;
    }
  }

  public updateSettings(settings: SensitivitySettings): void {
    this.settings = { ...this.settings, ...settings };
  }

  public stop(): void {
    this.buffer = [];
    this.lastProcessedTime = 0;
  }

  private extractRedValue(imageData: ImageData): number {
    const data = imageData.data;
    let totalRed = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      totalRed += data[i];
      pixelCount++;
    }

    return totalRed / pixelCount;
  }

  private updateBuffer(value: number): void {
    this.buffer.push(value);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
  }

  private detectPeak(currentValue: number): boolean {
    if (this.buffer.length < 3) return false;
    
    const previous = this.buffer[this.buffer.length - 2];
    const beforePrevious = this.buffer[this.buffer.length - 3];
    
    return previous > currentValue && 
           previous > beforePrevious && 
           previous > this.settings.heartbeatThreshold;
  }

  private calculateSignalQuality(): number {
    if (this.buffer.length < this.bufferSize / 2) return 0;

    const mean = this.buffer.reduce((a, b) => a + b, 0) / this.buffer.length;
    const variance = this.buffer.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / this.buffer.length;
    const stability = Math.exp(-Math.sqrt(variance) / mean);

    return Math.min(stability * this.settings.signalStability, 1);
  }

  private calculateBPM(): number {
    if (this.buffer.length < this.bufferSize) return 0;

    let peakCount = 0;
    for (let i = 2; i < this.buffer.length; i++) {
      if (this.buffer[i-1] > this.buffer[i] && 
          this.buffer[i-1] > this.buffer[i-2] &&
          this.buffer[i-1] > this.settings.heartbeatThreshold) {
        peakCount++;
      }
    }

    const duration = (this.bufferSize / 30) / 60; // duración en minutos
    return Math.round(peakCount / duration);
  }

  private calculateSpO2(imageData: ImageData): number {
    // Simulación básica de SpO2
    const quality = this.calculateSignalQuality();
    return Math.round(95 + (quality * 5));
  }

  private estimateBloodPressure(): { systolic: number; diastolic: number } {
    // Simulación básica de presión arterial
    const quality = this.calculateSignalQuality();
    const bpm = this.calculateBPM();
    
    const baseSystemic = 120;
    const baseDiastolic = 80;
    
    const systolic = Math.round(baseSystemic + ((bpm - 70) * 0.5 * quality));
    const diastolic = Math.round(baseDiastolic + ((bpm - 70) * 0.3 * quality));
    
    return { systolic, diastolic };
  }

  private analyzeArrhythmia(): { hasArrhythmia: boolean; arrhythmiaType: string } {
    if (this.buffer.length < this.bufferSize) {
      return { hasArrhythmia: false, arrhythmiaType: 'Normal' };
    }

    const intervals: number[] = [];
    let lastPeakIndex = -1;

    for (let i = 2; i < this.buffer.length; i++) {
      if (this.buffer[i-1] > this.buffer[i] && 
          this.buffer[i-1] > this.buffer[i-2] &&
          this.buffer[i-1] > this.settings.heartbeatThreshold) {
        if (lastPeakIndex !== -1) {
          intervals.push(i - lastPeakIndex);
        }
        lastPeakIndex = i;
      }
    }

    if (intervals.length < 3) {
      return { hasArrhythmia: false, arrhythmiaType: 'Normal' };
    }

    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const irregularity = intervals.reduce((a, b) => a + Math.abs(b - meanInterval), 0) / intervals.length;

    if (irregularity > 5) {
      return { hasArrhythmia: true, arrhythmiaType: 'Irregular' };
    }

    return { hasArrhythmia: false, arrhythmiaType: 'Normal' };
  }
}
