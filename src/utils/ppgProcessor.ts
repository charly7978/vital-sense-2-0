
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
  private signalBuffer: number[] = [];
  private readonly bufferSize = 90;
  private readonly qualityThreshold = 0.2;
  private mlModel: MLModel;
  private lastProcessingTime: number = 0;
  private readonly minProcessingInterval = 33;
  private lastValidBpm: number = 0;
  private lastValidSpO2: number = 98;
  private noFingerTimer: number | null = null;
  private readonly RESET_DELAY = 1000; // 1 segundo sin dedo para resetear
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1.5,
    noiseReduction: 1.2,
    peakDetection: 1.3
  };
  
  constructor() {
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
      if (now - this.lastProcessingTime < this.minProcessingInterval) {
        return null;
      }
      this.lastProcessingTime = now;

      const { red, ir, quality, fingerPresent } = this.signalExtractor.extractChannels(imageData);
      
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
          signalQuality: 0,
          confidence: 0,
          readings: this.readings,
          isPeak: false,
          redValue: red,
          hrvMetrics: {
            sdnn: 0,
            rmssd: 0,
            pnn50: 0,
            lfhf: 0
          }
        };
      }

      this.noFingerTimer = null;

      // Amplificar y almacenar señales
      const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
      const amplifiedIr = ir * this.sensitivitySettings.signalAmplification;
      
      this.redBuffer.push(amplifiedRed);
      this.irBuffer.push(amplifiedIr);
      
      // Mantener tamaño de buffer
      if (this.redBuffer.length > this.bufferSize) {
        this.redBuffer = this.redBuffer.slice(-this.bufferSize);
        this.irBuffer = this.irBuffer.slice(-this.bufferSize);
      }

      // Filtrar señal
      const filteredRed = this.signalFilter.lowPassFilter(
        this.redBuffer, 
        5 * this.sensitivitySettings.noiseReduction
      );

      // Normalizar señal
      const normalizedValue = this.signalNormalizer.normalizeSignal(
        filteredRed[filteredRed.length - 1]
      );
      
      // Agregar a lecturas
      this.readings.push({ timestamp: now, value: normalizedValue });
      if (this.readings.length > this.bufferSize) {
        this.readings = this.readings.slice(-this.bufferSize);
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

      // Mantener solo los últimos picos relevantes
      const recentPeaks = this.peakTimes.filter(t => now - t < 5000);
      this.peakTimes = recentPeaks;

      if (this.redBuffer.length < this.bufferSize) {
        console.log('Buffer insuficiente:', this.redBuffer.length);
        return null;
      }

      // Análisis de frecuencia y cálculo de BPM
      const { frequencies, magnitudes } = this.frequencyAnalyzer.performFFT(filteredRed);
      const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
      const dominantFreq = frequencies[dominantFreqIndex];
      let calculatedBpm = Math.round(dominantFreq * 60);
      
      // Validar BPM
      if (calculatedBpm >= 40 && calculatedBpm <= 200) {
        this.lastValidBpm = Math.round(this.lastValidBpm * 0.7 + calculatedBpm * 0.3);
      }

      // Calcular SpO2
      const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
      if (spo2Result.spo2 >= 80 && spo2Result.spo2 <= 100) {
        this.lastValidSpO2 = Math.round(this.lastValidSpO2 * 0.7 + spo2Result.spo2 * 0.3);
      }

      // Análisis de ritmo cardíaco
      const hrvAnalysis = this.signalProcessor.analyzeHRV(this.peakTimes);
      
      // Calcular presión arterial
      const bp = await this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);

      console.log('Procesamiento:', {
        bpm: this.lastValidBpm,
        spo2: this.lastValidSpO2,
        quality,
        bufferSize: this.redBuffer.length,
        peakCount: this.peakTimes.length
      });

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
