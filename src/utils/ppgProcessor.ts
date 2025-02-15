
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
  private readonly windowSize = 90; // Reducido para respuesta más rápida
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private beepPlayer: BeepPlayer;
  private signalBuffer: number[] = [];
  private readonly bufferSize = 60; // Reducido para respuesta más rápida
  private readonly qualityThreshold = 0.15; // Reducido para mayor sensibilidad
  private mlModel: MLModel;
  private lastProcessingTime: number = 0;
  private readonly minProcessingInterval = 33;
  private lastValidBpm: number = 0;
  private lastValidSpO2: number = 98;
  private noFingerTimer: number | null = null;
  private readonly RESET_DELAY = 1000;
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 2.0, // Aumentado para mayor sensibilidad
    noiseReduction: 1.2,
    peakDetection: 1.3
  };
  
  constructor() {
    console.log('Inicializando PPGProcessor con nueva configuración...');
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
    this.signalExtractor = new SignalExtractor();
    this.peakDetector = new PeakDetector();
    this.signalNormalizer = new SignalNormalizer();
    this.signalFilter = new SignalFilter(this.samplingRate);
    this.frequencyAnalyzer = new SignalFrequencyAnalyzer(this.samplingRate);
    this.mlModel = new MLModel();
  }

  private resetValues() {
    this.redBuffer = [];
    this.irBuffer = [];
    this.peakTimes = [];
    this.signalBuffer = [];
    this.lastValidBpm = 0;
    this.lastValidSpO2 = 98;
    this.readings = [];
    console.log('PPGProcessor: valores reseteados');
  }

  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    const now = Date.now();
    
    try {
      const { red, ir, quality, fingerPresent } = this.signalExtractor.extractChannels(imageData);

      console.log('Procesando frame:', {
        red,
        quality,
        fingerPresent,
        bufferLength: this.redBuffer.length
      });

      if (now - this.lastProcessingTime < this.minProcessingInterval) {
        return {
          bpm: this.lastValidBpm,
          spo2: this.lastValidSpO2,
          systolic: 0,
          diastolic: 0,
          hasArrhythmia: false,
          arrhythmiaType: 'Normal',
          signalQuality: quality,
          confidence: 0,
          readings: this.readings,
          isPeak: false,
          redValue: red,
          fingerPresent: fingerPresent,
          hrvMetrics: {
            sdnn: 0,
            rmssd: 0,
            pnn50: 0,
            lfhf: 0
          }
        };
      }
      
      this.lastProcessingTime = now;

      if (!fingerPresent) {
        if (this.noFingerTimer === null) {
          this.noFingerTimer = now;
        } else if (now - this.noFingerTimer >= this.RESET_DELAY) {
          this.resetValues();
        }
        return {
          bpm: 0,
          spo2: 0,
          systolic: 0,
          diastolic: 0,
          hasArrhythmia: false,
          arrhythmiaType: 'Normal',
          signalQuality: quality,
          confidence: 0,
          readings: [],
          isPeak: false,
          redValue: red,
          fingerPresent: fingerPresent,
          hrvMetrics: {
            sdnn: 0,
            rmssd: 0,
            pnn50: 0,
            lfhf: 0
          }
        };
      }

      this.noFingerTimer = null;

      // Limitar tamaño del buffer antes de agregar nuevos valores
      if (this.redBuffer.length >= this.bufferSize) {
        this.redBuffer = this.redBuffer.slice(-Math.floor(this.bufferSize * 0.8));
        this.irBuffer = this.irBuffer.slice(-Math.floor(this.bufferSize * 0.8));
      }

      // Amplificar y almacenar señales
      const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
      const amplifiedIr = ir * this.sensitivitySettings.signalAmplification;
      
      this.redBuffer.push(amplifiedRed);
      this.irBuffer.push(amplifiedIr);

      // Filtrar señal
      const filteredRed = this.signalFilter.lowPassFilter(this.redBuffer);

      // Normalizar señal
      const normalizedValue = this.signalNormalizer.normalizeSignal(
        filteredRed[filteredRed.length - 1]
      );
      
      this.readings.push({ timestamp: now, value: normalizedValue });
      if (this.readings.length > this.bufferSize) {
        this.readings = this.readings.slice(-Math.floor(this.bufferSize * 0.8));
      }
      
      // Detectar picos con señal filtrada
      const isPeak = this.peakDetector.detectPeak(
        filteredRed,
        this.sensitivitySettings.peakDetection
      );

      if (isPeak && quality > this.qualityThreshold) {
        this.peakTimes.push(now);
        await this.beepPlayer.playBeep('heartbeat');
        console.log('Pico detectado - reproduciendo beep');
      }

      // Mantener solo picos recientes (últimos 5 segundos)
      const recentPeakTimes = this.peakTimes.filter(t => now - t < 5000);
      this.peakTimes = recentPeakTimes;

      // Calcular BPM basado en intervalos entre picos
      if (recentPeakTimes.length >= 2) {
        const intervals = [];
        for (let i = 1; i < recentPeakTimes.length; i++) {
          intervals.push(recentPeakTimes[i] - recentPeakTimes[i-1]);
        }
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        const calculatedBpm = Math.round(60000 / avgInterval);
        
        if (calculatedBpm >= 40 && calculatedBpm <= 200) {
          this.lastValidBpm = Math.round(
            this.lastValidBpm * 0.7 + calculatedBpm * 0.3
          );
          console.log('BPM calculado:', this.lastValidBpm);
        }
      }

      // Calcular SpO2
      const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
      if (spo2Result.spo2 >= 80 && spo2Result.spo2 <= 100 && quality > this.qualityThreshold) {
        this.lastValidSpO2 = Math.round(
          this.lastValidSpO2 * 0.7 + spo2Result.spo2 * 0.3
        );
      }

      const hrvAnalysis = this.signalProcessor.analyzeHRV(this.peakTimes);
      const bp = await this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);

      return {
        bpm: this.lastValidBpm,
        spo2: this.lastValidSpO2,
        systolic: bp.systolic,
        diastolic: bp.diastolic,
        hasArrhythmia: hrvAnalysis.hasArrhythmia,
        arrhythmiaType: hrvAnalysis.type,
        signalQuality: quality,
        confidence: spo2Result.confidence,
        readings: this.readings,
        isPeak,
        redValue: red,
        fingerPresent: fingerPresent,
        hrvMetrics: {
          sdnn: hrvAnalysis.sdnn,
          rmssd: hrvAnalysis.rmssd,
          pnn50: hrvAnalysis.pnn50,
          lfhf: hrvAnalysis.lfhf
        }
      };
    } catch (error) {
      console.error('Error procesando frame:', error);
      return null;
    }
  }

  updateSensitivitySettings(settings: SensitivitySettings) {
    this.sensitivitySettings = settings;
  }
}
