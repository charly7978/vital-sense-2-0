
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
      const { red, quality, validPixels, totalPixels } = this.extractSignal(imageData);
      
      // Si no hay suficientes píxeles válidos, la señal es inválida
      if (validPixels / totalPixels < 0.1) {
        console.log('❌ Señal insuficiente:', {
          pixelesValidos: validPixels,
          pixelesTotales: totalPixels,
          ratio: validPixels / totalPixels
        });
        return this.createInvalidSignalResponse();
      }

      // Aplicar amplificación de señal basada en la configuración
      const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
      
      // Detectar latido usando el detector cuántico
      const isHeartbeat = this.heartbeatDetector.addSample(amplifiedRed, quality);
      
      // Obtener BPM actual
      const bpm = this.heartbeatDetector.getCurrentBPM();

      // Solo calcular SpO2 y presión si tenemos una señal mínimamente válida
      const signalQuality = quality * (bpm > 0 ? 1 : 0.5); // Penalizar si no hay latidos
      const spo2 = signalQuality > 0.6 ? this.calculateSpO2(signalQuality, amplifiedRed) : 0;
      const { systolic, diastolic } = signalQuality > 0.7 ? 
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

    // Analizar región central de la imagen
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.15); // Región más pequeña para mayor precisión

    // Calcular límites de la región
    const startY = Math.max(0, centerY - regionSize);
    const endY = Math.min(height, centerY + regionSize);
    const startX = Math.max(0, centerX - regionSize);
    const endX = Math.min(width, centerX + regionSize);
    const totalPixels = (endX - startX) * (endY - startY);

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const i = (y * width + x) * 4;
        const red = data[i];
        // Solo considerar píxeles con suficiente intensidad roja y no saturados
        if (red > 60 && red < 230) {
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
    // Evaluar la amplitud de la señal (diferencia entre máximo y mínimo)
    const amplitude = maxRed - minRed;
    const amplitudeQuality = Math.min(1, amplitude / 30); // Más sensible a cambios pequeños

    // Evaluar cobertura de píxeles válidos
    const coverageQuality = validPixels / totalPixels;

    // Evaluar intensidad media (debe estar en un rango óptimo)
    const optimalRedMean = 150; // Valor óptimo esperado
    const intensityQuality = 1 - Math.min(1, Math.abs(avgRed - optimalRedMean) / optimalRedMean);

    // Calcular calidad final considerando todos los factores
    const rawQuality = (
      amplitudeQuality * 0.5 + // La amplitud es el factor más importante
      coverageQuality * 0.3 + // La cobertura es el segundo factor más importante
      intensityQuality * 0.2   // La intensidad es el factor menos importante
    );

    // Aplicar reducción de ruido y normalizar
    return Math.min(1, rawQuality * this.sensitivitySettings.noiseReduction);
  }

  private calculateSpO2(quality: number, signal: number): number {
    // Solo calcular SpO2 si la calidad es suficiente
    if (quality < 0.6) return 0;
    
    const baseSpO2 = 95 + (quality * 4);
    return Math.min(100, Math.max(80, Math.round(baseSpO2 + (signal * 0.01))));
  }

  private calculateBloodPressure(signal: number, quality: number): { systolic: number; diastolic: number } {
    // Solo calcular presión si la calidad es suficiente
    if (quality < 0.7) return { systolic: 0, diastolic: 0 };
    
    const baseSystolic = 120 + (signal * 0.2);
    const baseDiastolic = 80 + (signal * 0.1);

    return {
      systolic: Math.min(180, Math.max(90, Math.round(baseSystolic))),
      diastolic: Math.min(110, Math.max(60, Math.round(baseDiastolic)))
    };
  }
}
