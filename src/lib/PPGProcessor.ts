// src/lib/PPGProcessor.ts

import { SignalFilter } from './SignalFilter';
import { FingerDetector } from './FingerDetector';
import { WaveletAnalyzer } from './WaveletAnalyzer';
import { SignalQualityAnalyzer } from './SignalQualityAnalyzer';
import { BeepPlayer } from './BeepPlayer';
import type { 
  PPGData, 
  SensitivitySettings, 
  ArrhythmiaType, 
  SignalQualityLevel,
  ProcessedFrame,
  VitalSigns
} from '@/types';

export class PPGProcessor {
  private readonly signalFilter: SignalFilter;
  private readonly fingerDetector: FingerDetector;
  private readonly waveletAnalyzer: WaveletAnalyzer;
  private readonly qualityAnalyzer: SignalQualityAnalyzer;
  private readonly beepPlayer: BeepPlayer;

  // Buffers circulares para análisis
  private readonly maxBufferSize = 1024;
  private readonly signalBuffer: Float32Array;
  private readonly timeBuffer: Float32Array;
  private readonly qualityBuffer: Float32Array;
  private bufferIndex = 0;
  private samplesProcessed = 0;

  // Estado del procesador
  private lastPeakTime = 0;
  private lastValidBPM = 0;
  private confidenceScore = 0;
  private calibrationData: number[] = [];
  private isCalibrating = true;
  private readonly calibrationDuration = 5000; // 5 segundos

  // Análisis de arritmias
  private readonly hrvBuffer: number[] = [];
  private readonly maxHrvBufferSize = 50;
  private lastArrhythmiaCheck = 0;
  private arrhythmiaHistory: ArrhythmiaType[] = [];

  constructor(
    private settings: SensitivitySettings,
    private readonly sampleRate: number = 30
  ) {
    this.signalFilter = new SignalFilter(sampleRate);
    this.fingerDetector = new FingerDetector();
    this.waveletAnalyzer = new WaveletAnalyzer(sampleRate);
    this.qualityAnalyzer = new SignalQualityAnalyzer();
    this.beepPlayer = new BeepPlayer();

    // Inicializar buffers
    this.signalBuffer = new Float32Array(this.maxBufferSize);
    this.timeBuffer = new Float32Array(this.maxBufferSize);
    this.qualityBuffer = new Float32Array(this.maxBufferSize);
  }

  public async processFrame(imageData: ImageData): Promise<PPGData> {
    const startTime = performance.now();
    const timestamp = Date.now();

    // Detección de dedo y calidad de imagen
    const fingerResult = this.fingerDetector.detectFinger(imageData);
    if (!fingerResult.isPresent) {
      return this.generateEmptyResult(timestamp, 'No finger detected');
    }

    // Extraer y procesar señal PPG
    const rawValue = this.extractPPGSignal(imageData, fingerResult.position);
    const processedValue = this.signalFilter.processRealTimeSignal(rawValue);
    
    // Actualizar buffers
    this.updateBuffers(processedValue, timestamp);

    // Análisis de calidad de señal
    const quality = this.qualityAnalyzer.analyzeQuality(
      this.getCurrentWindow()
    );

    // Si estamos calibrando, acumular datos
    if (this.isCalibrating) {
      return this.handleCalibration(timestamp, processedValue, quality);
    }

    // Análisis wavelet para detección de picos
    const waveletResult = this.waveletAnalyzer.analyze(
      this.getCurrentWindow()
    );

    // Actualizar HRV y detectar arritmias
    if (waveletResult.isPeak) {
      this.updateHRVBuffer(timestamp);
      await this.beepPlayer.play();
    }

    // Calcular signos vitales
    const vitalSigns = this.calculateVitalSigns(waveletResult, quality);

    // Análisis de arritmias
    const arrhythmiaResult = this.analyzeArrhythmias();

    // Calcular tiempo de procesamiento
    const processingTime = performance.now() - startTime;

    return {
      ...vitalSigns,
      hasArrhythmia: arrhythmiaResult.hasArrhythmia,
      arrhythmiaType: arrhythmiaResult.type,
      confidence: this.confidenceScore,
      readings: Array.from(this.getCurrentWindow()),
      isPeak: waveletResult.isPeak,
      signalQuality: quality,
      timestamp,
      value: processedValue,
      processingTime,
      hrv: this.calculateHRVMetrics(),
      perfusionIndex: this.calculatePerfusionIndex(),
      stressIndex: this.calculateStressIndex(),
      respirationRate: this.estimateRespirationRate(),
      deviceInfo: {
        frameRate: this.sampleRate,
        resolution: {
          width: imageData.width,
          height: imageData.height
        },
        lightLevel: this.calculateAmbientLight(imageData)
      }
    };
  }

  private extractPPGSignal(
    imageData: ImageData, 
    position: { x: number; y: number }
  ): number {
    const region = this.extractRegionOfInterest(imageData, position);
    const redChannel = this.getRedChannelIntensity(region);
    return this.normalizeSignal(redChannel);
  }

  private extractRegionOfInterest(
    imageData: ImageData,
    position: { x: number; y: number }
  ): ImageData {
    const size = 20; // ROI size
    const ctx = document.createElement('canvas').getContext('2d')!;
    return ctx.getImageData(
      position.x - size/2,
      position.y - size/2,
      size,
      size
    );
  }

  private getRedChannelIntensity(region: ImageData): number {
    let total = 0;
    for (let i = 0; i < region.data.length; i += 4) {
      total += region.data[i]; // Red channel
    }
    return total / (region.data.length / 4);
  }

  private updateBuffers(value: number, timestamp: number): void {
    this.signalBuffer[this.bufferIndex] = value;
    this.timeBuffer[this.bufferIndex] = timestamp;
    this.bufferIndex = (this.bufferIndex + 1) % this.maxBufferSize;
    this.samplesProcessed++;
  }

  private getCurrentWindow(): Float32Array {
    const windowSize = Math.min(this.samplesProcessed, this.maxBufferSize);
    const window = new Float32Array(windowSize);
    
    for (let i = 0; i < windowSize; i++) {
      const idx = (this.bufferIndex - windowSize + i + this.maxBufferSize) % this.maxBufferSize;
      window[i] = this.signalBuffer[idx];
    }
    
    return window;
  }

  private handleCalibration(
    timestamp: number,
    value: number,
    quality: SignalQualityLevel
  ): PPGData {
    this.calibrationData.push(value);
    
    if (timestamp - this.lastPeakTime >= this.calibrationDuration) {
      this.finishCalibration();
    }
    
    return this.generateEmptyResult(timestamp, 'Calibrating...');
  }

  private finishCalibration(): void {
    if (this.calibrationData.length > 0) {
      const stats = this.calculateStats(this.calibrationData);
      this.waveletAnalyzer.updateThresholds(stats);
      this.isCalibrating = false;
    }
  }

  private calculateVitalSigns(
    waveletResult: { isPeak: boolean; frequency: number },
    quality: SignalQualityLevel
  ): VitalSigns {
    const bpm = this.calculateBPM(waveletResult.frequency);
    const spo2 = this.calculateSpO2();
    const { systolic, diastolic } = this.estimateBloodPressure();

    return {
      bpm,
      spo2,
      systolic,
      diastolic,
      quality,
      perfusionIndex: this.calculatePerfusionIndex(),
      respirationRate: this.estimateRespirationRate(),
      stressLevel: this.calculateStressLevel()
    };
  }

  private calculateBPM(frequency: number): number {
    const instantBPM = frequency * 60;
    
    if (this.lastValidBPM === 0) {
      this.lastValidBPM = instantBPM;
    } else {
      // Filtro de mediana móvil para estabilizar BPM
      this.lastValidBPM = 0.7 * this.lastValidBPM + 0.3 * instantBPM;
    }
    
    return Math.round(this.lastValidBPM);
  }

  private calculateSpO2(): number {
    // Implementación del cálculo de SpO2 usando la ratio R/IR
    // Este es un cálculo simplificado
    const redIntensity = this.getAverageIntensity(this.getCurrentWindow());
    return Math.min(100, Math.max(70, 100 - (100 - redIntensity) * 0.5));
  }

  private estimateBloodPressure(): { systolic: number; diastolic: number } {
    // Estimación basada en características de la forma de onda PPG
    const window = this.getCurrentWindow();
    const peakToPeakTime = this.waveletAnalyzer.getPeakToPeakInterval(window);
    const amplitude = this.getSignalAmplitude(window);
    
    // Algoritmo simplificado de estimación
    const baselineSystolic = 120;
    const baselineDiastolic = 80;
    
    const systolic = baselineSystolic + (amplitude * 20 - peakToPeakTime * 0.1);
    const diastolic = baselineDiastolic + (amplitude * 10 - peakToPeakTime * 0.05);
    
    return {
      systolic: Math.round(Math.max(90, Math.min(180, systolic))),
      diastolic: Math.round(Math.max(60, Math.min(120, diastolic)))
    };
  }

  private analyzeArrhythmias(): { hasArrhythmia: boolean; type: ArrhythmiaType } {
    if (this.hrvBuffer.length < 5) {
      return { hasArrhythmia: false, type: ArrhythmiaType.Normal };
    }

    const hrvStats = this.calculateHRVMetrics();
    const irregularityScore = this.calculateIrregularityScore(hrvStats);
    
    if (irregularityScore > 0.7) {
      return { hasArrhythmia: true, type: ArrhythmiaType.AFib };
    } else if (irregularityScore > 0.4) {
      return { hasArrhythmia: true, type: ArrhythmiaType.PrematureBeats };
    }
    
    return { hasArrhythmia: false, type: ArrhythmiaType.Normal };
  }

  private calculateHRVMetrics(): { sdnn: number; rmssd: number; pnn50: number } {
    if (this.hrvBuffer.length < 2) {
      return { sdnn: 0, rmssd: 0, pnn50: 0 };
    }

    const intervals = this.hrvBuffer;
    const diffs = intervals.slice(1).map((v, i) => v - intervals[i]);
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const sdnn = Math.sqrt(
      intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length
    );
    
    const rmssd = Math.sqrt(
      diffs.reduce((a, b) => a + b * b, 0) / (diffs.length)
    );
    
    const nn50 = diffs.filter(d => Math.abs(d) > 50).length;
    const pnn50 = (nn50 / diffs.length) * 100;

    return { sdnn, rmssd, pnn50 };
  }

  private calculatePerfusionIndex(): number {
    const window = this.getCurrentWindow();
    const { max, min } = this.getMinMax(window);
    const dc = (max + min) / 2;
    return dc === 0 ? 0 : ((max - min) / dc) * 100;
  }

  private calculateStressIndex(): number {
    const hrvMetrics = this.calculateHRVMetrics();
    const stressScore = 100 - (hrvMetrics.sdnn / 100) * 50;
    return Math.max(0, Math.min(100, stressScore));
  }

  private estimateRespirationRate(): number {
    // Usar variación en amplitud de PPG para estimar respiración
    const window = this.getCurrentWindow();
    const envelope = this.calculateSignalEnvelope(window);
    const respirationFreq = this.findDominantFrequency(envelope);
    return Math.round(respirationFreq * 60);
  }

  private calculateSignalEnvelope(signal: Float32Array): Float32Array {
    const envelope = new Float32Array(signal.length);
    const windowSize = Math.floor(this.sampleRate / 2);
    
    for (let i = 0; i < signal.length; i++) {
      let max = -Infinity;
      for (let j = Math.max(0, i - windowSize); j < Math.min(signal.length, i + windowSize); j++) {
        max = Math.max(max, signal[j]);
      }
      envelope[i] = max;
    }
    
    return envelope;
  }

  private findDominantFrequency(signal: Float32Array): number {
    // Implementación simplificada usando FFT
    // En una implementación real, usaríamos una FFT completa
    const sum = signal.reduce((a, b) => a + b, 0) / signal.length;
    const crossings = this.countZeroCrossings(signal.map(v => v - sum));
    return crossings / (2 * signal.length / this.sampleRate);
  }

  private updateSettings(newSettings: Partial<SensitivitySettings>): void {
    this.settings = { ...this.settings, ...newSettings };
    this.waveletAnalyzer.updateSettings(this.settings);
    this.qualityAnalyzer.updateSettings(this.settings);
  }

  private generateEmptyResult(timestamp: number, message: string): PPGData {
    return {
      bpm: 0,
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      hasArrhythmia: false,
      arrhythmiaType: ArrhythmiaType.Normal,
      confidence: 0,
      readings: [],
      isPeak: false,
      signalQuality: SignalQualityLevel.Invalid,
      timestamp,
      value: 0,
      processingTime: 0,
      hrv: { sdnn: 0, rmssd: 0, pnn50: 0 },
      perfusionIndex: 0,
      stressIndex: 0,
      respirationRate: 0,
      deviceInfo: {
        frameRate: this.sampleRate,
        resolution: { width: 0, height: 0 },
        lightLevel: 0
      }
    };
  }
}
