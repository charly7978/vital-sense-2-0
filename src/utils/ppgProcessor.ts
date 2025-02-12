
import { VitalReading, PPGData, SensitivitySettings, ProcessingSettings } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';
import { SignalExtractor } from './signalExtraction';
import { PeakDetector } from './peakDetection';
import { SignalNormalizer } from './signalNormalization';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';
import { MLModel } from './mlModel';
import { EventEmitter } from './events';

export class PPGProcessor extends EventEmitter {
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
  private signalBuffer: number[] = [];
  private readonly bufferSize = 90;
  private readonly qualityThreshold = 0.2;
  private mlModel: MLModel;
  private lastProcessingTime: number = 0;
  private readonly minProcessingInterval = 33;
  private lastValidBpm: number = 0;
  private lastValidSpO2: number = 98;
  private noFingerTimer: number | null = null;
  private readonly RESET_DELAY = 1000;
  private lastFingerState: boolean = false;
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1.5,
    noiseReduction: 1.2,
    peakDetection: 1.3
  };
  
  constructor() {
    super(); // Inicializamos EventEmitter
    console.log('Inicializando PPGProcessor...');
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

      // Emitir evento si el estado del dedo cambió
      if (fingerPresent !== this.lastFingerState) {
        this.lastFingerState = fingerPresent;
        this.emit('fingerStateChange', fingerPresent);
        console.log('Estado del dedo actualizado:', fingerPresent);
      }

      // Control de frecuencia de procesamiento
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
      
      // Mantener tamaño de lecturas
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
      }

      // Mantener solo picos recientes
      this.peakTimes = this.peakTimes.filter(t => now - t < 5000);

      if (this.redBuffer.length < Math.floor(this.bufferSize * 0.5)) {
        console.log('Buffer insuficiente:', this.redBuffer.length);
        return null;
      }

      // Análisis y cálculos
      const { frequencies, magnitudes } = this.frequencyAnalyzer.performFFT(filteredRed);
      const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
      const dominantFreq = frequencies[dominantFreqIndex];
      let calculatedBpm = Math.round(dominantFreq * 60);
      
      if (calculatedBpm >= 40 && calculatedBpm <= 200) {
        this.lastValidBpm = Math.round(this.lastValidBpm * 0.7 + calculatedBpm * 0.3);
      }

      const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
      if (spo2Result.spo2 >= 80 && spo2Result.spo2 <= 100) {
        this.lastValidSpO2 = Math.round(this.lastValidSpO2 * 0.7 + spo2Result.spo2 * 0.3);
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
