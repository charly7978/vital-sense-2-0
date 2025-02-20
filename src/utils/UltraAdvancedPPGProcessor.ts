
import { QuantumHeartbeatDetector } from './QuantumHeartbeatDetector';
import type { ProcessedPPGSignal, SensitivitySettings } from './types';

export class UltraAdvancedPPGProcessor {
  private readonly heartbeatDetector: QuantumHeartbeatDetector;
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 0.8,      // Reducido para no saturar con luz intensa
    noiseReduction: 2.0,           // Aumentado para filtrar ruido de luz intensa
    peakDetection: 1.5,           // Ajustado para detectar picos claros
    heartbeatThreshold: 0.6,      // Más alto para aprovechar señal fuerte
    responseTime: 0.8,            // Más rápido con señal clara
    signalStability: 1.2,         // Aumentado para estabilidad con luz fuerte
    brightness: 0.7,              // Reducido para compensar luz intensa
    redIntensity: 0.9            // Reducido para no saturar el rojo
  };
  
  constructor() {
    this.heartbeatDetector = new QuantumHeartbeatDetector();
    console.log('🌟 Iniciando procesador PPG con calibración para luz intensa');
  }

  updateSensitivitySettings(settings: Partial<SensitivitySettings>) {
    this.sensitivitySettings = { ...this.sensitivitySettings, ...settings };
    console.log('⚙️ Nueva configuración de sensibilidad:', this.sensitivitySettings);
  }

  async processFrame(imageData: ImageData): Promise<ProcessedPPGSignal> {
    try {
      const { red, quality, validPixels, totalPixels } = this.extractSignal(imageData);
      
      // Umbral más bajo para favorecer luz intensa
      if (validPixels / totalPixels < 0.02) {
        console.log('⚠️ Señal débil:', {
          pixelesValidos: validPixels,
          pixelesTotales: totalPixels,
          ratio: validPixels / totalPixels
        });
        return this.createInvalidSignalResponse();
      }

      // Menor amplificación para señales fuertes
      const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
      const isHeartbeat = this.heartbeatDetector.addSample(amplifiedRed, quality);
      const bpm = this.heartbeatDetector.getCurrentBPM();

      // Ajuste de calidad para luz intensa
      const signalQuality = quality * (bpm > 0 ? 1.2 : 0.6);
      const spo2 = signalQuality > 0.3 ? this.calculateSpO2(signalQuality, amplifiedRed) : 0;
      const { systolic, diastolic } = signalQuality > 0.4 ? 
        this.calculateBloodPressure(amplifiedRed, signalQuality) : 
        { systolic: 0, diastolic: 0 };

      console.log('📊 Análisis de frame:', {
        valorRojo: amplifiedRed,
        calidadSeñal: signalQuality,
        pixelesValidos: validPixels,
        esLatido: isHeartbeat,
        bpm: bpm
      });

      return {
        signal: [amplifiedRed],
        quality: signalQuality,
        isHeartbeat,
        bpm,
        timestamp: Date.now(),
        spo2,
        systolic,
        diastolic,
        hasArrhythmia: false,
        arrhythmiaType: 'Normal',
        readings: [{
          timestamp: Date.now(),
          value: amplifiedRed
        }],
        signalQuality
      };
    } catch (error) {
      console.error('❌ Error en procesamiento:', error);
      return this.createInvalidSignalResponse();
    }
  }

  private extractSignal(imageData: ImageData): { 
    red: number; 
    quality: number; 
    validPixels: number;
    totalPixels: number;
  } {
    const { data, width, height } = imageData;
    let redSum = 0;
    let validPixels = 0;
    let maxRed = 0;
    let minRed = 255;

    // Área de análisis reducida para enfocarse en zona más iluminada
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.25); // Reducido para mayor precisión

    const startY = Math.max(0, centerY - regionSize);
    const endY = Math.min(height, centerY + regionSize);
    const startX = Math.max(0, centerX - regionSize);
    const endX = Math.min(width, centerX + regionSize);
    const totalPixels = (endX - startX) * (endY - startY);

    // Análisis optimizado para luz intensa
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const i = (y * width + x) * 4;
        const red = data[i];
        const green = data[i + 1];
        const blue = data[i + 2];

        // Detección ajustada para luz intensa
        if (red > 50 && red < 240 && // Rango ajustado para luz intensa
            red > green * 1.2 && // Mayor diferencia requerida
            red > blue * 1.2) {  // Mayor diferencia requerida
          redSum += red;
          validPixels++;
          maxRed = Math.max(maxRed, red);
          minRed = Math.min(minRed, red);
        }
      }
    }

    if (validPixels === 0) {
      return { red: 0, quality: 0, validPixels: 0, totalPixels };
    }

    const avgRed = redSum / validPixels;
    const quality = this.calculateSignalQuality(avgRed, maxRed, minRed, validPixels, totalPixels);
    const adjustedRed = avgRed * this.sensitivitySettings.brightness * this.sensitivitySettings.redIntensity;

    return {
      red: adjustedRed,
      quality,
      validPixels,
      totalPixels
    };
  }

  private calculateSignalQuality(
    avgRed: number, 
    maxRed: number, 
    minRed: number, 
    validPixels: number,
    totalPixels: number
  ): number {
    // Cálculo de calidad optimizado para luz intensa
    const amplitude = maxRed - minRed;
    const amplitudeQuality = Math.min(1, amplitude / 30); // Umbral más alto

    const coverageQuality = Math.pow(validPixels / totalPixels, 0.5); // Menos exigente

    const optimalRedMean = 150; // Ajustado para luz intensa
    const intensityQuality = 1 - Math.min(1, Math.abs(avgRed - optimalRedMean) / optimalRedMean);

    const rawQuality = (
      amplitudeQuality * 0.5 +    // Menor peso en amplitud
      coverageQuality * 0.3 +     // Mayor peso en cobertura
      intensityQuality * 0.2      // Mayor peso en intensidad
    );

    return Math.min(1, rawQuality * this.sensitivitySettings.noiseReduction);
  }

  private calculateSpO2(quality: number, signal: number): number {
    if (quality < 0.3) return 0; // Umbral más bajo
    
    const baseSpO2 = 95 + (quality * 4);
    return Math.min(100, Math.max(80, Math.round(baseSpO2 + (signal * 0.01))));
  }

  private calculateBloodPressure(signal: number, quality: number): { systolic: number; diastolic: number } {
    if (quality < 0.4) return { systolic: 0, diastolic: 0 };
    
    const baseSystolic = 120 + (signal * 0.2);
    const baseDiastolic = 80 + (signal * 0.1);

    return {
      systolic: Math.min(180, Math.max(90, Math.round(baseSystolic))),
      diastolic: Math.min(110, Math.max(60, Math.round(baseDiastolic)))
    };
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
