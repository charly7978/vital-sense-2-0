
import type { ProcessedPPGSignal, SensitivitySettings } from './types';

export class WaveletPPGProcessor {
  private readonly bufferSize: number = 256; // Aumentado para mejor análisis
  private readonly samplingRate: number = 30;
  private readonly signalBuffer: number[] = [];
  private readonly timeBuffer: number[] = [];
  private lastProcessedTime: number = 0;
  private lastPerfusionIndex: number = 0;
  private lastBPM: number = 0;
  private consecutiveValidPulses: number = 0;
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 3.5,      // Aumentado para mejor detección
    noiseReduction: 0.8,           // Reducido para preservar señal
    peakDetection: 0.6,           // Más sensible
    heartbeatThreshold: 0.25,     // Más sensible
    responseTime: 1.2,            // Más suave
    signalStability: 2.0,         // Mayor estabilidad
    brightness: 1.5,              // Mayor sensibilidad a luz
    redIntensity: 1.8            // Mayor sensibilidad al rojo
  };

  constructor() {
    console.log('🌊 Iniciando procesador PPG basado en Wavelets');
  }

  updateSensitivitySettings(settings: Partial<SensitivitySettings>): void {
    this.sensitivitySettings = {
      ...this.sensitivitySettings,
      ...settings
    };
  }

  private extractColorComponents(imageData: ImageData): { red: number, green: number, blue: number } {
    const { data, width, height } = imageData;
    let redSum = 0, greenSum = 0, blueSum = 0;
    let validPixels = 0;

    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const roiSize = Math.floor(Math.min(width, height) * 0.3);
    
    // Análisis de ROI optimizado
    for (let y = centerY - roiSize; y < centerY + roiSize; y++) {
      for (let x = centerX - roiSize; x < centerX + roiSize; x++) {
        if (y >= 0 && y < height && x >= 0 && x < width) {
          const i = (y * width + x) * 4;
          const r = data[i] * this.sensitivitySettings.redIntensity;
          const g = data[i + 1];
          const b = data[i + 2];

          if (r > 20) { // Umbral más bajo para capturar señales débiles
            redSum += r;
            greenSum += g;
            blueSum += b;
            validPixels++;
          }
        }
      }
    }

    if (validPixels < 100) return { red: 0, green: 0, blue: 0 }; // Mínimo de píxeles válidos

    const amplification = this.sensitivitySettings.signalAmplification;
    return {
      red: (redSum / validPixels) * amplification,
      green: (greenSum / validPixels),
      blue: (blueSum / validPixels)
    };
  }

  private calculatePerfusionIndex(red: number, green: number): number {
    if (red === 0) return this.lastPerfusionIndex;
    
    // Perfusión mejorada con mejor diferenciación AC/DC
    const ac = Math.abs(red - green) * this.sensitivitySettings.signalAmplification;
    const dc = red * 0.5 + green * 0.5;
    let perfusionIndex = (ac / dc) * 3.0;

    // Filtro de estabilidad
    perfusionIndex = this.applySmoothing(perfusionIndex);
    this.lastPerfusionIndex = perfusionIndex;

    return perfusionIndex;
  }

  private applySmoothing(value: number): number {
    const alpha = 0.25; // Suavizado más agresivo
    if (this.signalBuffer.length === 0) return value;
    return alpha * value + (1 - alpha) * this.lastPerfusionIndex;
  }

  private findPeaks(signal: number[]): number[] {
    if (signal.length < 5) return [];
    
    const peaks: number[] = [];
    const threshold = this.calculateAdaptiveThreshold(signal);
    
    for (let i = 2; i < signal.length - 2; i++) {
      const window = signal.slice(i-2, i+3);
      const current = signal[i];
      
      if (current === Math.max(...window) && 
          current > threshold &&
          current > signal[i-1] * 1.05) {
        peaks.push(i);
      }
    }
    
    return this.filterValidPeaks(peaks);
  }

  private calculateAdaptiveThreshold(signal: number[]): number {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const std = Math.sqrt(signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length);
    return mean + std * this.sensitivitySettings.peakDetection;
  }

  private filterValidPeaks(peaks: number[]): number[] {
    if (peaks.length < 2) return peaks;
    
    const validPeaks: number[] = [peaks[0]];
    for (let i = 1; i < peaks.length; i++) {
      const interval = this.timeBuffer[peaks[i]] - this.timeBuffer[peaks[i-1]];
      if (interval > 250 && interval < 2000) { // 30-240 bpm
        validPeaks.push(peaks[i]);
      }
    }
    
    return validPeaks;
  }

  private calculateHeartRate(peaks: number[]): number {
    if (peaks.length < 2) {
      this.consecutiveValidPulses = 0;
      return this.lastBPM;
    }
    
    const intervals = peaks.slice(1).map((p, i) => this.timeBuffer[p] - this.timeBuffer[peaks[i]]);
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60000 / avgInterval);
    
    // Validación de BPM
    if (bpm >= 30 && bpm <= 200) {
      this.consecutiveValidPulses++;
      if (this.consecutiveValidPulses >= 3) {
        this.lastBPM = bpm;
        return bpm;
      }
    } else {
      this.consecutiveValidPulses = 0;
    }
    
    return this.lastBPM;
  }

  async processFrame(imageData: ImageData): Promise<ProcessedPPGSignal> {
    const { red, green, blue } = this.extractColorComponents(imageData);
    const perfusionIndex = this.calculatePerfusionIndex(red, green);
    
    // Control de frecuencia de procesamiento
    const currentTime = Date.now();
    if (currentTime - this.lastProcessedTime < 33) { // ~30fps
      return this.createSignalResponse(perfusionIndex, currentTime);
    }
    this.lastProcessedTime = currentTime;

    this.signalBuffer.push(perfusionIndex);
    this.timeBuffer.push(currentTime);
    
    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer.shift();
      this.timeBuffer.shift();
    }

    const peaks = this.findPeaks(this.signalBuffer);
    const heartRate = this.calculateHeartRate(peaks);
    const signalQuality = this.calculateSignalQuality(peaks, perfusionIndex);

    const spo2 = this.estimateSpO2(red, perfusionIndex);
    const { systolic, diastolic } = this.estimateBloodPressure(peaks, perfusionIndex);

    return this.createSignalResponse(perfusionIndex, currentTime, heartRate, signalQuality, spo2, systolic, diastolic, peaks.length > 0);
  }

  private calculateSignalQuality(peaks: number[], perfusionIndex: number): number {
    if (perfusionIndex < 0.1) return 0;
    
    const peakQuality = Math.min(1, peaks.length / 4);
    const perfusionQuality = Math.min(1, perfusionIndex / 2);
    
    return (peakQuality * 0.7 + perfusionQuality * 0.3) * this.sensitivitySettings.signalStability;
  }

  private estimateSpO2(red: number, perfusionIndex: number): number {
    if (perfusionIndex < 0.1) return 0;
    const baseSpO2 = 96 + (perfusionIndex * 2);
    return Math.min(100, Math.max(80, Math.round(baseSpO2)));
  }

  private estimateBloodPressure(peaks: number[], perfusionIndex: number): { systolic: number, diastolic: number } {
    if (peaks.length < 2 || perfusionIndex < 0.1) {
      return { systolic: 0, diastolic: 0 };
    }

    const baseValue = 120;
    const systolic = baseValue + (perfusionIndex * 15);
    const diastolic = (systolic * 0.65);

    return {
      systolic: Math.min(180, Math.max(90, Math.round(systolic))),
      diastolic: Math.min(110, Math.max(60, Math.round(diastolic)))
    };
  }

  private createSignalResponse(
    perfusionIndex: number,
    timestamp: number,
    heartRate: number = 0,
    signalQuality: number = 0,
    spo2: number = 0,
    systolic: number = 0,
    diastolic: number = 0,
    isHeartbeat: boolean = false
  ): ProcessedPPGSignal {
    return {
      signal: [perfusionIndex],
      quality: signalQuality,
      isHeartbeat,
      bpm: heartRate,
      timestamp,
      spo2,
      systolic,
      diastolic,
      hasArrhythmia: false,
      arrhythmiaType: 'Normal',
      readings: [{
        timestamp,
        value: perfusionIndex
      }],
      signalQuality
    };
  }
}
