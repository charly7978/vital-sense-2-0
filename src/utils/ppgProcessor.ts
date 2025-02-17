import { VitalReading, PPGData, SensitivitySettings, ProcessingSettings } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';
import { SignalExtractor } from './signalExtraction';
import { PeakDetector } from './peakDetection';
import { SignalNormalizer } from './signalNormalization';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';
import { MLModel } from './mlModel';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private peakTimes: number[] = [];
  private readonly samplingRate = 30;
  private readonly windowSize = 128;
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private beepPlayer: BeepPlayer;
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 30;
  private readonly qualityThreshold = 0.2;
  private mlModel: MLModel;
  private trainingData: number[][] = [];
  private targetData: number[][] = [];
  private frameCount: number = 0;
  private lastValidBpm: number = 0;
  private lastValidSystolic: number = 120;
  private lastValidDiastolic: number = 80;
  private readonly isAndroid: boolean;
  private lastValidReadings: {
    bpm: number;
    spo2: number;
    systolic: number;
    diastolic: number;
  } = { bpm: 0, spo2: 0, systolic: 0, diastolic: 0 };
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1.5,
    noiseReduction: 1.2,
    peakDetection: 1.3
  };
  
  private processingSettings: ProcessingSettings = {
    MEASUREMENT_DURATION: 30,
    MIN_FRAMES_FOR_CALCULATION: 15,
    MIN_PEAKS_FOR_VALID_HR: 2,
    MIN_PEAK_DISTANCE: 400,
    MAX_PEAK_DISTANCE: 1200,
    PEAK_THRESHOLD_FACTOR: 0.4,
    MIN_RED_VALUE: 15,
    MIN_RED_DOMINANCE: 1.2,
    MIN_VALID_PIXELS_RATIO: 0.2,
    MIN_BRIGHTNESS: 80,
    MIN_VALID_READINGS: 30,
    FINGER_DETECTION_DELAY: 500,
    MIN_SPO2: 75
  };
  
  constructor() {
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
    this.signalExtractor = new SignalExtractor();
    this.peakDetector = new PeakDetector();
    this.signalNormalizer = new SignalNormalizer();
    this.signalFilter = new SignalFilter(this.samplingRate);
    this.frequencyAnalyzer = new SignalFrequencyAnalyzer(this.samplingRate);
    this.mlModel = new MLModel();
    this.isAndroid = /Android/i.test(navigator.userAgent);
  }

  private validateVitalSigns(bpm: number, systolic: number, diastolic: number): {
    bpm: number;
    systolic: number;
    diastolic: number;
  } {
    // Validar BPM (40-200 es un rango normal para humanos)
    const validBpm = bpm >= 40 && bpm <= 200 ? bpm : this.lastValidBpm || 0;
    
    // Validar presión sistólica (90-180 es un rango normal)
    const validSystolic = systolic >= 90 && systolic <= 180 ? 
      systolic : this.lastValidSystolic;
    
    // Validar presión diastólica (60-120 es un rango normal)
    const validDiastolic = diastolic >= 60 && diastolic <= 120 ? 
      diastolic : this.lastValidDiastolic;
    
    // Asegurar que sistólica > diastólica
    if (validSystolic <= validDiastolic) {
      return {
        bpm: validBpm,
        systolic: this.lastValidSystolic,
        diastolic: this.lastValidDiastolic
      };
    }

    // Actualizar últimos valores válidos
    this.lastValidBpm = validBpm;
    this.lastValidSystolic = validSystolic;
    this.lastValidDiastolic = validDiastolic;

    return {
      bpm: validBpm,
      systolic: validSystolic,
      diastolic: validDiastolic
    };
  }

  private async updateSettingsWithML(calculatedBpm: number, spo2: number, signalQuality: number) {
    try {
      const inputFeatures = [calculatedBpm, spo2, signalQuality];
      const optimizedSettings = await this.mlModel.predictOptimizedSettings(inputFeatures);
      
      if (!isNaN(optimizedSettings[0]) && !isNaN(optimizedSettings[1]) && !isNaN(optimizedSettings[2])) {
        console.log("Valores ML recibidos:", optimizedSettings);
        
        if (optimizedSettings[0] >= 10 && optimizedSettings[0] <= 30) {
          this.processingSettings.MIN_RED_VALUE = optimizedSettings[0];
        }
        if (optimizedSettings[1] >= 0.3 && optimizedSettings[1] <= 0.7) {
          this.processingSettings.PEAK_THRESHOLD_FACTOR = optimizedSettings[1];
        }
        if (optimizedSettings[2] >= 0.1 && optimizedSettings[2] <= 0.5) {
          this.processingSettings.MIN_VALID_PIXELS_RATIO = optimizedSettings[2];
        }

        console.log("✔ Parámetros ML actualizados:", {
          MIN_RED_VALUE: this.processingSettings.MIN_RED_VALUE,
          PEAK_THRESHOLD_FACTOR: this.processingSettings.PEAK_THRESHOLD_FACTOR,
          MIN_VALID_PIXELS_RATIO: this.processingSettings.MIN_VALID_PIXELS_RATIO,
          inputFeatures
        });
      } else {
        console.warn("⚠ Valores ML inválidos recibidos:", optimizedSettings);
      }
    } catch (error) {
      console.error("Error actualizando settings con ML:", error);
    }
  }

  private async trainMLModel() {
    if (this.trainingData.length > 10) {
      console.log("Entrenando modelo ML con", this.trainingData.length, "muestras");
      await this.mlModel.trainModel(this.trainingData, this.targetData);
    } else {
      console.log("Datos insuficientes para entrenar:", this.trainingData.length, "muestras");
    }
  }

  private saveTrainingData(calculatedBpm: number, spo2: number, signalQuality: number) {
    if (calculatedBpm > 40 && calculatedBpm < 200 && 
        spo2 >= 75 && spo2 <= 100 && 
        signalQuality > 0.2) {
      
      this.trainingData.push([calculatedBpm, spo2, signalQuality]);
      this.targetData.push([
        this.processingSettings.MIN_RED_VALUE,
        this.processingSettings.PEAK_THRESHOLD_FACTOR,
        this.processingSettings.MIN_VALID_PIXELS_RATIO
      ]);

      console.log("Datos de entrenamiento guardados:", {
        entrada: [calculatedBpm, spo2, signalQuality],
        objetivo: [
          this.processingSettings.MIN_RED_VALUE,
          this.processingSettings.PEAK_THRESHOLD_FACTOR,
          this.processingSettings.MIN_VALID_PIXELS_RATIO
        ]
      });

      if (this.trainingData.length > 100) {
        this.trainingData.shift();
        this.targetData.shift();
      }
    } else {
      console.log("Datos ignorados por valores fuera de rango:", {
        bpm: calculatedBpm,
        spo2,
        signalQuality
      });
    }
  }

  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    // Optimizar procesamiento según plataforma
    const processedFrame = this.isAndroid 
      ? await this.processAndroidFrame(imageData)
      : await this.processWebcamFrame(imageData);

    if (!processedFrame) return null;

    const { red, ir, quality } = processedFrame;

    // Validación mejorada de la señal
    if (!this.validateSignal(red, ir, quality)) {
      return this.getEmptyReading();
    }

    // Procesamiento optimizado según plataforma
    const readings = this.isAndroid 
      ? this.processAndroidSignal(red, ir)
      : this.processWebcamSignal(red, ir);

    // Validar y suavizar resultados
    const smoothedReadings = this.smoothReadings(readings);

    return {
      ...smoothedReadings,
      signalQuality: quality,
      readings: this.getReadings(),
    };
  }

  private validateSignal(red: number, ir: number, quality: number): boolean {
    const minQuality = this.isAndroid ? 0.4 : 0.3;
    const minRed = this.isAndroid ? 50 : 30;
    const minIr = this.isAndroid ? 40 : 25;

    return quality >= minQuality && red >= minRed && ir >= minIr;
  }

  private smoothReadings(readings: any) {
    const alpha = 0.3; // Factor de suavizado
    
    this.lastValidReadings = {
      bpm: this.smoothValue(readings.bpm, this.lastValidReadings.bpm, alpha),
      spo2: this.smoothValue(readings.spo2, this.lastValidReadings.spo2, alpha),
      systolic: this.smoothValue(readings.systolic, this.lastValidReadings.systolic, alpha),
      diastolic: this.smoothValue(readings.diastolic, this.lastValidReadings.diastolic, alpha)
    };

    return this.lastValidReadings;
  }

  private smoothValue(newValue: number, lastValue: number, alpha: number): number {
    if (newValue === 0) return lastValue;
    if (lastValue === 0) return newValue;
    return Math.round(alpha * newValue + (1 - alpha) * lastValue);
  }

  private async processAndroidFrame(frame: ImageData) {
    // Optimizaciones específicas para Android
    const redChannel = new Uint8ClampedArray(frame.data.length/4);
    const irChannel = new Uint8ClampedArray(frame.data.length/4);
    
    for(let i = 0; i < frame.data.length; i += 4) {
      redChannel[i/4] = frame.data[i];     // Canal rojo para PPG
      irChannel[i/4] = frame.data[i + 2];  // Canal azul para SpO2
    }

    // Procesamiento optimizado para Android
    return {
      red: this.calculateMeanIntensity(redChannel),
      ir: this.calculateMeanIntensity(irChannel),
      quality: this.calculateSignalQuality(redChannel)
    };
  }

  private async processWebcamFrame(frame: ImageData) {
    // Optimizaciones específicas para webcam
    const enhancedData = new Uint8ClampedArray(frame.data);
    
    // Mejorar contraste y reducir ruido
    for(let i = 0; i < frame.data.length; i += 4) {
      const r = frame.data[i];
      const g = frame.data[i + 1];
      const b = frame.data[i + 2];
      
      // Aumentar contraste en canales relevantes
      enhancedData[i] = Math.min(255, r * 1.2);     // R
      enhancedData[i + 2] = Math.min(255, b * 1.1); // B
    }

    const redChannel = enhancedData.filter((_, i) => i % 4 === 0);
    const irChannel = enhancedData.filter((_, i) => i % 4 === 2);

    return {
      red: this.calculateMeanIntensity(redChannel),
      ir: this.calculateMeanIntensity(irChannel),
      quality: this.calculateSignalQuality(redChannel)
    };
  }

  private calculateMeanIntensity(channel: Uint8ClampedArray): number {
    const sum = channel.reduce((a, b) => a + b, 0);
    return sum / channel.length;
  }

  private calculateSignalQuality(channel: Uint8ClampedArray): number {
    const mean = this.calculateMeanIntensity(channel);
    const variance = channel.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / channel.length;
    const stdDev = Math.sqrt(variance);
    
    // Normalizar calidad entre 0 y 1
    return Math.min(1, Math.max(0, 1 - (stdDev / mean)));
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }

  updateSensitivitySettings(settings: SensitivitySettings) {
    this.sensitivitySettings = settings;
    console.log('Sensitivity settings updated:', settings);
  }

  processSignal(signal: number[]): {
    bpm: number;
    confidence: number;
  } {
    // Aplicar filtros específicos según plataforma
    const filteredSignal = this.isAndroid 
      ? this.applyAndroidFilters(signal)
      : this.applyWebcamFilters(signal);

    // Detectar picos con umbrales adaptados
    const peaks = this.detectPeaks(filteredSignal);
    
    // Calcular BPM con compensación según plataforma
    const bpm = this.calculateBPM(peaks);
    
    // Calcular confianza basada en la calidad de la señal
    const confidence = this.calculateConfidence(filteredSignal, peaks);

    return { bpm, confidence };
  }

  private applyAndroidFilters(signal: number[]): number[] {
    // Filtros optimizados para señal de cámara trasera + linterna
    return signal
      .map((value, index, array) => {
        // Filtro paso banda específico para PPG móvil
        const filtered = this.bandPassFilter(value, 0.5, 4.0);
        // Eliminar ruido de movimiento
        return this.motionArtifactRemoval(filtered, index, array);
      });
  }

  private applyWebcamFilters(signal: number[]): number[] {
    // Filtros optimizados para webcam
    return signal
      .map((value, index, array) => {
        // Filtro paso banda más amplio para webcam
        const filtered = this.bandPassFilter(value, 0.3, 5.0);
        // Compensar iluminación variable
        return this.illuminationCompensation(filtered, index, array);
      });
  }

  // ... implementar métodos auxiliares ...
}
