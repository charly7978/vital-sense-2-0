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
  private readonly windowSize = 150;
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private beepPlayer: BeepPlayer;
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 15;
  private readonly qualityThreshold = 0.15;
  private mlModel: MLModel;
  private trainingData: number[][] = [];
  private targetData: number[][] = [];
  private frameCount: number = 0;
  private lastValidBpm: number = 0;
  private lastValidSystolic: number = 120;
  private lastValidDiastolic: number = 80;
  private lastBeepTime: number = 0;
  private readonly minBeepInterval = 300;

  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 2.0,
    noiseReduction: 1.0,
    peakDetection: 1.1,
    heartbeatThreshold: 0.4,
    responseTime: 1.0,
    signalStability: 0.5,
    brightness: 1.0,
    redIntensity: 1.0
  };

  private processingSettings: ProcessingSettings = {
    MEASUREMENT_DURATION: 30,
    MIN_FRAMES_FOR_CALCULATION: 10,
    MIN_PEAKS_FOR_VALID_HR: 1,
    MIN_PEAK_DISTANCE: 300,
    MAX_PEAK_DISTANCE: 1500,
    PEAK_THRESHOLD_FACTOR: 0.3,
    MIN_RED_VALUE: 15,
    MIN_RED_DOMINANCE: 1.1,
    MIN_VALID_PIXELS_RATIO: 0.15,
    MIN_BRIGHTNESS: 80,
    MIN_VALID_READINGS: 15,
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
  }

  private async playHeartbeatBeep(quality: number) {
    const now = Date.now();
    if (now - this.lastBeepTime < this.minBeepInterval) {
      return;
    }
    
    try {
      const volume = Math.max(quality * 10, 3.0);
      await this.beepPlayer.playBeep('heartbeat', volume);
      this.lastBeepTime = now;
      
      console.log('💓 Beep de latido:', {
        tiempo: now,
        calidad: quality.toFixed(2),
        volumen: volume.toFixed(2)
      });
    } catch (error) {
      console.error('Error reproduciendo beep:', error);
    }
  }

  private validateVitalSigns(bpm: number, systolic: number, diastolic: number): {
    bpm: number;
    systolic: number;
    diastolic: number;
  } {
    const validBpm = bpm >= 40 && bpm <= 200 ? bpm : this.lastValidBpm || 0;
    const validSystolic = systolic >= 90 && systolic <= 180 ? 
      systolic : this.lastValidSystolic;
    const validDiastolic = diastolic >= 60 && diastolic <= 120 ? 
      diastolic : this.lastValidDiastolic;
    
    if (validSystolic <= validDiastolic) {
      return {
        bpm: validBpm,
        systolic: this.lastValidSystolic,
        diastolic: this.lastValidDiastolic
      };
    }

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
    this.frameCount++;
    const now = Date.now();
    
    const { red, ir, quality, perfusionIndex } = this.signalExtractor.extractChannels(imageData);
    
    if (this.frameCount % 30 === 0) {
      console.log('🔍 Estado del sensor detallado:', {
        tiempo: new Date(now).toISOString(),
        frame: this.frameCount,
        deteccionDedo: {
          valorRojo: red.toFixed(2),
          umbralMinimo: this.processingSettings.MIN_RED_VALUE,
          detectado: red > this.processingSettings.MIN_RED_VALUE,
          infrarrojo: ir.toFixed(2),
          calidadBase: (quality * 100).toFixed(1) + '%',
          indicePerfusion: perfusionIndex.toFixed(2) + '%'
        },
        buffersEstado: {
          tamanoBufferRojo: this.redBuffer.length,
          tamanoBufferIR: this.irBuffer.length,
          tamanoBufferSenal: this.signalBuffer.length,
          maximoBuffer: this.windowSize
        }
      });
    }
    
    if (quality < this.qualityThreshold || red < this.processingSettings.MIN_RED_VALUE) {
      if (this.frameCount % 30 === 0) {
        console.log('⚠️ Señal insuficiente:', { 
          valorRojo: red.toFixed(2), 
          calidadActual: (quality * 100).toFixed(1) + '%'
        });
      }
      return null;
    }
    
    const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
    const amplifiedIr = ir * this.sensitivitySettings.signalAmplification;
    
    this.redBuffer.push(amplifiedRed);
    this.irBuffer.push(amplifiedIr);
    
    if (this.redBuffer.length > this.windowSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
    
    const filteredRed = this.signalFilter.lowPassFilter(this.redBuffer, 
      3 * this.sensitivitySettings.noiseReduction);
    const normalizedValue = this.signalNormalizer.normalizeSignal(
      filteredRed[filteredRed.length - 1]
    );
    
    this.readings.push({ timestamp: now, value: normalizedValue });
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }

    this.signalBuffer.push(normalizedValue);
    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer.shift();
    }

    if (this.signalBuffer.length >= this.bufferSize) {
      const isPeak = this.peakDetector.isRealPeak(normalizedValue, now, this.signalBuffer);

      if (isPeak) {
        this.peakTimes.push(now);
        if (this.peakTimes.length > 10) {
          this.peakTimes.shift();
        }
        await this.playHeartbeatBeep(quality);
        
        console.log('💓 Pico detectado:', {
          tiempo: new Date(now).toISOString(),
          valor: normalizedValue.toFixed(4),
          calidad: (quality * 100).toFixed(1) + '%',
          picosTotales: this.peakTimes.length
        });
      }

      if (filteredRed.length >= this.processingSettings.MIN_FRAMES_FOR_CALCULATION) {
        const { frequencies, magnitudes } = this.frequencyAnalyzer.performFFT(filteredRed);
        const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
        const dominantFreq = frequencies[dominantFreqIndex];
        const calculatedBpm = dominantFreq * 60;
        
        if (this.frameCount % 30 === 0) {
          console.log('📈 FFT:', {
            bpm: calculatedBpm.toFixed(1),
            frecuencia: dominantFreq.toFixed(3) + 'Hz',
            muestras: filteredRed.length
          });
        }

        const intervals = this.peakTimes.slice(1).map((time, i) => time - this.peakTimes[i]);
        const hrvAnalysis = this.signalProcessor.analyzeHRV(intervals);
        const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
        const bp = this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);
        const signalQuality = this.signalProcessor.analyzeSignalQuality(filteredRed);
        
        const validatedVitals = this.validateVitalSigns(calculatedBpm, bp.systolic, bp.diastolic);

        if (validatedVitals.bpm > 0 && this.frameCount % 30 === 0) {
          console.log('🫀 Signos vitales:', {
            bpm: validatedVitals.bpm.toFixed(1),
            spo2: spo2Result.spo2.toFixed(1) + '%',
            presion: `${validatedVitals.systolic}/${validatedVitals.diastolic}`,
            calidad: (signalQuality * 100).toFixed(1) + '%'
          });
        }

        return {
          bpm: validatedVitals.bpm,
          spo2: Math.min(100, Math.max(75, spo2Result.spo2)),
          systolic: validatedVitals.systolic,
          diastolic: validatedVitals.diastolic,
          hasArrhythmia: hrvAnalysis.hasArrhythmia,
          arrhythmiaType: hrvAnalysis.type,
          signalQuality,
          confidence: spo2Result.confidence,
          readings: this.readings,
          isPeak,
          hrvMetrics: {
            sdnn: hrvAnalysis.sdnn,
            rmssd: hrvAnalysis.rmssd,
            pnn50: hrvAnalysis.pnn50,
            lfhf: hrvAnalysis.lfhf
          }
        };
      }
    }

    return null;
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }

  updateSensitivitySettings(settings: SensitivitySettings) {
    this.sensitivitySettings = settings;
    console.log('Sensitivity settings updated:', settings);
  }
}
