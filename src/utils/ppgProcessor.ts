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
  private readonly windowSize = 300;
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

  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    this.frameCount++;
    const now = Date.now();

    const { red, ir, quality } = this.signalExtractor.extractChannels(imageData);

    if (quality < this.qualityThreshold || red < 15) {
      this.redBuffer = [];
      this.irBuffer = [];
      this.readings = [];
      this.peakTimes = [];
      return { bpm: 0, spo2: 0, systolic: 0, diastolic: 0, hasArrhythmia: false, arrhythmiaType: 'Normal', signalQuality: 0, confidence: 0, readings: [], isPeak: false, hrvMetrics: { sdnn: 0, rmssd: 0, pnn50: 0, lfhf: 0 } };
    }

    this.redBuffer.push(red);
    this.irBuffer.push(ir);
    if (this.redBuffer.length > this.windowSize) this.redBuffer.shift();
    if (this.irBuffer.length > this.windowSize) this.irBuffer.shift();

    // 🔥 Filtro de Butterworth y Filtro de Mediana para reducir ruido
    let filteredRed = this.signalFilter.butterworthFilter(this.redBuffer, 2, 1.5);
    filteredRed = this.signalFilter.medianFilter(filteredRed, 3);

    const normalizedValue = this.signalNormalizer.normalizeSignal(filteredRed[filteredRed.length - 1]);
    this.readings.push({ timestamp: now, value: normalizedValue });
    if (this.readings.length > this.windowSize) this.readings = this.readings.slice(-this.windowSize);

    // 🔥 Cálculo de BPM con FFT y Detección de Picos
    const { frequencies, magnitudes } = this.frequencyAnalyzer.performFFT(filteredRed);
    const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
    const bpmFromFFT = frequencies[dominantFreqIndex] * 60;
    const bpmFromPeaks = this.peakDetector.estimateBPM(this.peakTimes);
    const calculatedBpm = (bpmFromFFT * 0.7) + (bpmFromPeaks * 0.3);

    // 🔥 Análisis de HRV, SpO2 y presión arterial
    const hrvAnalysis = this.signalProcessor.analyzeHRV(this.peakTimes);
    const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
    const bp = this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);
    const signalQuality = this.signalProcessor.analyzeSignalQuality(filteredRed);

    const isPeak = this.peakDetector.isRealPeak(normalizedValue, now, this.signalBuffer);
    if (isPeak) {
      this.peakTimes.push(now);
      if (this.peakTimes.length > 10) this.peakTimes.shift();
      this.beepPlayer.playBeep('heartbeat', signalQuality).catch(err => console.error('Error al reproducir beep:', err));
    }

    if (this.frameCount % 30 === 0 && calculatedBpm > 0) {
      this.trainingData.push([calculatedBpm, spo2Result.spo2, signalQuality]);
      this.targetData.push([15, 0.4, 0.2]);
      await this.mlModel.trainModel(this.trainingData, this.targetData);
      await this.mlModel.predictOptimizedSettings([calculatedBpm, spo2Result.spo2, signalQuality]);
    }

    return {
      bpm: calculatedBpm,
      spo2: Math.min(100, Math.max(75, spo2Result.spo2)),
      systolic: bp.systolic,
      diastolic: bp.diastolic,
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

  getReadings(): VitalReading[] {
    return this.readings;
  }
}
