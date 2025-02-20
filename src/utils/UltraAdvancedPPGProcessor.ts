
import { QuantumHeartbeatDetector } from './QuantumHeartbeatDetector';
import type { ProcessedPPGSignal, SensitivitySettings } from './types';

export class UltraAdvancedPPGProcessor {
  private readonly heartbeatDetector: QuantumHeartbeatDetector;
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 2.5, // Aumentado de 1.5 a 2.5
    noiseReduction: 1.4,      // Aumentado de 1.2 a 1.4
    peakDetection: 1.5,       // Aumentado de 1.3 a 1.5
    heartbeatThreshold: 0.35,  // Reducido de 0.5 a 0.35 para mayor sensibilidad
    responseTime: 1.0,
    signalStability: 0.6,     // Aumentado de 0.5 a 0.6
    brightness: 1.2,          // Aumentado de 1.0 a 1.2
    redIntensity: 1.3         // Aumentado de 1.0 a 1.3
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
      const { red, quality, validPixels, totalPixels } = this.extractSignal(imageData);
      
      // Ajustado el umbral mínimo de píxeles válidos
      if (validPixels / totalPixels < 0.05) { // Reducido de 0.1 a 0.05
        console.log('❌ Señal insuficiente:', {
          pixelesValidos: validPixels,
          pixelesTotales: totalPixels,
          ratio: validPixels / totalPixels
        });
        return this.createInvalidSignalResponse();
      }

      // Aplicar amplificación de señal basada en la configuración
      const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
      
      // Detectar latido usando el detector cuántico con umbral ajustado
      const isHeartbeat = this.heartbeatDetector.addSample(amplifiedRed, quality);
      
      // Obtener BPM actual
      const bpm = this.heartbeatDetector.getCurrentBPM();

      // Ajustado el umbral de calidad de señal
      const signalQuality = quality * (bpm > 0 ? 1.2 : 0.6); // Aumentado el multiplicador
      const spo2 = signalQuality > 0.5 ? this.calculateSpO2(signalQuality, amplifiedRed) : 0; // Reducido umbral de 0.6 a 0.5
      const { systolic, diastolic } = signalQuality > 0.6 ? 
        this.calculateBloodPressure(amplifiedRed, signalQuality) : 
        { systolic: 0, diastolic: 0 };

      console.log('📊 Procesamiento de frame:', {
        valorRojo: amplifiedRed,
        calidadSeñal: signalQuality,
        pixelesValidos: validPixels,
        esLatido: isHeartbeat,
        bpm: bpm,
        configuracion: this.sensitivitySettings
      });

      return {
        signal: [amplifiedRed],
        quality: signalQuality,
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
        signalQuality: signalQuality
      };
    } catch (error) {
      console.error('Error procesando frame:', error);
      return this.createInvalidSignalResponse();
    }
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

    // Analizar región central más grande
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.25); // Aumentado de 0.15 a 0.25

    const startY = Math.max(0, centerY - regionSize);
    const endY = Math.min(height, centerY + regionSize);
    const startX = Math.max(0, centerX - regionSize);
    const endX = Math.min(width, centerX + regionSize);
    const totalPixels = (endX - startX) * (endY - startY);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const i = (y * width + x) * 4;
        const red = data[i];
        // Ajustado el rango de intensidad válida
        if (red > 40 && red < 240) { // Ampliado el rango de 60-230 a 40-240
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
      quality: quality,
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
    // Evaluar la amplitud de la señal
    const amplitude = maxRed - minRed;
    const amplitudeQuality = Math.min(1, amplitude / 25); // Reducido de 30 a 25

    // Evaluar cobertura de píxeles válidos con umbral más bajo
    const coverageQuality = Math.pow(validPixels / totalPixels, 0.8); // Ajuste exponencial más suave

    // Evaluar intensidad media
    const optimalRedMean = 140; // Reducido de 150 a 140
    const intensityQuality = 1 - Math.min(1, Math.abs(avgRed - optimalRedMean) / optimalRedMean);

    // Calcular calidad final con pesos ajustados
    const rawQuality = (
      amplitudeQuality * 0.6 +  // Aumentado de 0.5 a 0.6
      coverageQuality * 0.25 +  // Reducido de 0.3 a 0.25
      intensityQuality * 0.15   // Reducido de 0.2 a 0.15
    );

    // Aplicar reducción de ruido y normalizar
    return Math.min(1, rawQuality * this.sensitivitySettings.noiseReduction);
  }

  private calculateSpO2(quality: number, signal: number): number {
    if (quality < 0.5) return 0; // Reducido de 0.6 a 0.5
    
    const baseSpO2 = 95 + (quality * 4);
    return Math.min(100, Math.max(80, Math.round(baseSpO2 + (signal * 0.01))));
  }

  private calculateBloodPressure(signal: number, quality: number): { systolic: number; diastolic: number } {
    if (quality < 0.6) return { systolic: 0, diastolic: 0 };
    
    const baseSystolic = 120 + (signal * 0.2);
    const baseDiastolic = 80 + (signal * 0.1);

    return {
      systolic: Math.min(180, Math.max(90, Math.round(baseSystolic))),
      diastolic: Math.min(110, Math.max(60, Math.round(baseDiastolic)))
    };
  }
}
