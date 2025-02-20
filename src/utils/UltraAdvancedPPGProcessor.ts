
import { QuantumHeartbeatDetector } from './QuantumHeartbeatDetector';
import type { ProcessedPPGSignal, SensitivitySettings } from './types';

export class UltraAdvancedPPGProcessor {
  private readonly heartbeatDetector: QuantumHeartbeatDetector;
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1.5,
    noiseReduction: 1.2,
    peakDetection: 1.3,
    heartbeatThreshold: 0.5,
    responseTime: 1.0,
    signalStability: 0.5,
    brightness: 1.0,
    redIntensity: 1.0
  };
  
  constructor() {
    this.heartbeatDetector = new QuantumHeartbeatDetector();
  }

  updateSensitivitySettings(settings: Partial<SensitivitySettings>) {
    this.sensitivitySettings = { ...this.sensitivitySettings, ...settings };
    console.log('Configuración de sensibilidad actualizada:', this.sensitivitySettings);
  }

  async processFrame(imageData: ImageData): Promise<ProcessedPPGSignal> {
    try {
      // Extraer señal del frame y normalizar
      const { red, quality } = this.extractSignal(imageData);
      
      // Aplicar amplificación de señal basada en la configuración
      const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
      
      // Detectar latido usando el detector cuántico con umbral ajustado
      const isHeartbeat = this.heartbeatDetector.addSample(
        amplifiedRed, 
        quality * this.sensitivitySettings.signalStability
      );
      
      // Obtener BPM actual
      const bpm = this.heartbeatDetector.getCurrentBPM();

      // Calcular SpO2 basado en la calidad de la señal
      const spo2 = this.calculateSpO2(quality, amplifiedRed);

      // Calcular presión arterial basada en la señal
      const { systolic, diastolic } = this.calculateBloodPressure(amplifiedRed, quality);

      console.log('📊 Procesamiento de frame:', {
        valorRojo: amplifiedRed,
        calidadSeñal: quality,
        esLatido: isHeartbeat,
        bpm: bpm,
        configuracion: this.sensitivitySettings
      });

      return {
        signal: [amplifiedRed],
        quality: quality,
        isHeartbeat: isHeartbeat,
        bpm: bpm,
        timestamp: Date.now(),
        spo2: spo2,
        systolic: systolic,
        diastolic: diastolic,
        hasArrhythmia: false,
        arrhythmiaType: 'Normal',
        readings: [{
          timestamp: Date.now(),
          value: amplifiedRed
        }],
        signalQuality: quality
      };
    } catch (error) {
      console.error('Error procesando frame:', error);
      throw error;
    }
  }

  private extractSignal(imageData: ImageData): { red: number; quality: number } {
    const { data, width, height } = imageData;
    let redSum = 0;
    let validPixels = 0;
    let maxRed = 0;
    let minRed = 255;

    // Analizar región central de la imagen (más pequeña para mejor precisión)
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.2); // Reducido a 20% para mejor enfoque

    for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
      for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
        const i = (y * width + x) * 4;
        if (i >= 0 && i < data.length) {
          const red = data[i];
          if (red > 50 && red < 240) { // Ajustado rango válido
            redSum += red;
            validPixels++;
            maxRed = Math.max(maxRed, red);
            minRed = Math.min(minRed, red);
          }
        }
      }
    }

    if (validPixels === 0) {
      return { red: 0, quality: 0 };
    }

    const avgRed = redSum / validPixels;
    const quality = this.calculateSignalQuality(avgRed, maxRed, minRed, validPixels);

    // Aplicar ajustes de brillo y intensidad del rojo
    const adjustedRed = avgRed * this.sensitivitySettings.brightness * this.sensitivitySettings.redIntensity;

    return {
      red: adjustedRed,
      quality: Math.min(1, quality * this.sensitivitySettings.signalStability * 1.2) // Aumentado factor de calidad
    };
  }

  private calculateSignalQuality(avgRed: number, maxRed: number, minRed: number, validPixels: number): number {
    // Calcular calidad basada en varios factores
    const amplitude = maxRed - minRed;
    const amplitudeQuality = Math.min(1, amplitude / 40); // Ajustado para ser más sensible
    const coverageQuality = Math.min(1, validPixels / 800);
    const intensityQuality = Math.min(1, (avgRed - 50) / 150);

    // Aplicar factor de reducción de ruido
    const baseQuality = (amplitudeQuality + coverageQuality + intensityQuality) / 3;
    return Math.min(1, baseQuality * this.sensitivitySettings.noiseReduction);
  }

  private calculateSpO2(quality: number, signal: number): number {
    if (quality < 0.4) return 0;
    // Simulación mejorada de SpO2
    const baseSpO2 = 95 + (quality * 4);
    return Math.min(100, Math.max(80, Math.round(baseSpO2 + (signal * 0.01))));
  }

  private calculateBloodPressure(signal: number, quality: number): { systolic: number; diastolic: number } {
    if (quality < 0.4) return { systolic: 0, diastolic: 0 };
    
    // Simulación mejorada de presión arterial
    const baseSystolic = 120 + (signal * 0.2);
    const baseDiastolic = 80 + (signal * 0.1);

    return {
      systolic: Math.min(180, Math.max(90, Math.round(baseSystolic))),
      diastolic: Math.min(110, Math.max(60, Math.round(baseDiastolic)))
    };
  }
}
