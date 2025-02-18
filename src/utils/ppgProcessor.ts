// ==================== PPGProcessor.ts ====================

import { SignalProcessor } from './SignalProcessor';
import { FingerDetector } from './FingerDetector';
import { PPGSynchronizer } from './PPGSynchronizer';
import { AdaptiveCalibrator } from './AdaptiveCalibrator';
import { WaveletAnalyzer } from './WaveletAnalyzer';
import { BeepPlayer } from './audioUtils';
import type { PPGData, VitalSigns, HRVMetrics } from '@/types';

export class PPGProcessor {
  // OPTIMIZACIÓN: Componentes avanzados
  private readonly signalProcessor: SignalProcessor;
  private readonly fingerDetector: FingerDetector;
  private readonly ppgSynchronizer: PPGSynchronizer;
  private readonly calibrator: AdaptiveCalibrator;
  private readonly waveletAnalyzer: WaveletAnalyzer;
  private readonly beepPlayer: BeepPlayer;

  // OPTIMIZACIÓN: Buffers y estado mejorados
  private readonly bufferSize = 180;  // 6 segundos a 30fps
  private readonly peakBuffer: boolean[] = [];
  private readonly timeBuffer: number[] = [];
  private readonly qualityBuffer: number[] = [];
  private lastProcessedTime: number = 0;
  private measurementStartTime: number = 0;
  private frameCount: number = 0;

  // OPTIMIZACIÓN: Configuración mejorada
  private readonly settings = {
    minSignalQuality: 0.45,
    minPeakAmplitude: 0.3,
    minStability: 0.7,
    beepVolume: 5.0,
    calibrationFactor: 1.15
  };

  constructor() {
    this.signalProcessor = new SignalProcessor();
    this.fingerDetector = new FingerDetector();
    this.ppgSynchronizer = new PPGSynchronizer();
    this.calibrator = new AdaptiveCalibrator();
    this.waveletAnalyzer = new WaveletAnalyzer();
    this.beepPlayer = new BeepPlayer();
  }

  // OPTIMIZACIÓN: Procesamiento de frame mejorado
  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    try {
      this.frameCount++;
      const now = Date.now();

      // OPTIMIZACIÓN: Control de frecuencia
      if (now - this.lastProcessedTime < 33) { // ~30fps
        return null;
      }

      // OPTIMIZACIÓN: Detección de dedo mejorada
      const fingerDetection = this.fingerDetector.detectFinger(imageData);
      if (!fingerDetection.isPresent) {
        this.handleNoFinger();
        return null;
      }

      // OPTIMIZACIÓN: Extracción y sincronización
      const { signal, quality } = this.extractSignal(imageData);
      const syncResult = this.ppgSynchronizer.synchronize(signal, now);

      // OPTIMIZACIÓN: Análisis wavelet
      const waveletAnalysis = this.waveletAnalyzer.analyzeSignal([signal]);

      // OPTIMIZACIÓN: Actualización de buffers
      this.updateBuffers(signal, quality, now);

      // OPTIMIZACIÓN: Detección de picos mejorada
      if (syncResult.isPeak && waveletAnalysis.quality > this.settings.minSignalQuality) {
        await this.handlePeak(now, waveletAnalysis.quality);
      }

      // OPTIMIZACIÓN: Cálculo de vitales
      const vitals = this.calculateVitals(syncResult, waveletAnalysis);

      // OPTIMIZACIÓN: Análisis de HRV
      const hrvMetrics = this.analyzeHRV();

      return {
        timestamp: now,
        value: signal,
        quality: waveletAnalysis.quality,
        isPeak: syncResult.isPeak,
        bpm: vitals.bpm,
        spo2: vitals.spo2,
        systolic: vitals.systolic,
        diastolic: vitals.diastolic,
        hasArrhythmia: vitals.hasArrhythmia,
        arrhythmiaType: vitals.arrhythmiaType,
        hrvMetrics,
        debug: {
          fingerConfidence: fingerDetection.confidence,
          syncQuality: syncResult.syncStatus.quality,
          waveletQuality: waveletAnalysis.quality,
          peakConfidence: syncResult.isPeak ? waveletAnalysis.quality : 0
        }
      };

    } catch (error) {
      console.error('Error en procesamiento PPG:', error);
      return null;
    } finally {
      this.lastProcessedTime = now;
    }
  }

  // OPTIMIZACIÓN: Extracción de señal mejorada
  private extractSignal(imageData: ImageData): { signal: number; quality: number } {
    const { red, ir } = this.signalProcessor.extractChannels(imageData);
    const quality = this.calculateSignalQuality(red, ir);
    
    return { signal: red, quality };
  }

  // OPTIMIZACIÓN: Manejo de picos mejorado
  private async handlePeak(timestamp: number, quality: number) {
    try {
      // OPTIMIZACIÓN: Reproducción de beep mejorada
      await this.beepPlayer.playBeep('heartbeat', this.settings.beepVolume);
      
      // OPTIMIZACIÓN: Actualización de picos
      this.peakBuffer.push(true);
      this.timeBuffer.push(timestamp);
      
      if (this.peakBuffer.length > this.bufferSize) {
        this.peakBuffer.shift();
        this.timeBuffer.shift();
      }

      console.log('🫀 Pico detectado:', {
        tiempo: timestamp,
        calidad: quality.toFixed(2)
      });
    } catch (err) {
      console.error('Error en manejo de pico:', err);
    }
  }

  // OPTIMIZACIÓN: Cálculo de vitales mejorado
  private calculateVitals(syncResult: any, waveletAnalysis: any): VitalSigns {
    const conditions = {
      signalQuality: waveletAnalysis.quality,
      lightLevel: this.calculateLightLevel(),
      movement: syncResult.syncStatus.quality,
      coverage: this.calculateCoverage(),
      temperature: this.estimateTemperature(),
      measurementType: 'bpm'
    };

    return this.signalProcessor.processFrame({
      ...conditions,
      timestamp: Date.now(),
      syncResult,
      waveletAnalysis
    });
  }

  // OPTIMIZACIÓN: Análisis de HRV mejorado
  private analyzeHRV(): HRVMetrics {
    if (this.timeBuffer.length < 6) {
      return this.getEmptyHRVMetrics();
    }

    const intervals = [];
    for (let i = 1; i < this.timeBuffer.length; i++) {
      intervals.push(this.timeBuffer[i] - this.timeBuffer[i-1]);
    }

    return {
      sdnn: this.calculateSDNN(intervals),
      rmssd: this.calculateRMSSD(intervals),
      pnn50: this.calculatePNN50(intervals),
      triangularIndex: this.calculateTriangularIndex(intervals)
    };
  }

  // OPTIMIZACIÓN: Métodos auxiliares mejorados
  private calculateSignalQuality(red: number, ir: number): number {
    const ratio = red / (ir + 1e-6);
    const ratioQuality = Math.exp(-Math.abs(ratio - 1.5));
    
    const stability = this.calculateStability([red, ir]);
    
    return Math.min(stability * 0.7 + ratioQuality * 0.3, 1);
  }

  private calculateStability(values: number[]): number {
    if (values.length < 2) return 0;
    
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
    
    return Math.exp(-Math.sqrt(variance) / mean);
  }

  private calculateSDNN(intervals: number[]): number {
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    return Math.sqrt(variance);
  }

  private calculateRMSSD(intervals: number[]): number {
    let sum = 0;
    for (let i = 1; i < intervals.length; i++) {
      sum += Math.pow(intervals[i] - intervals[i-1], 2);
    }
    return Math.sqrt(sum / (intervals.length - 1));
  }

  private calculatePNN50(intervals: number[]): number {
    let nn50 = 0;
    for (let i = 1; i < intervals.length; i++) {
      if (Math.abs(intervals[i] - intervals[i-1]) > 50) {
        nn50++;
      }
    }
    return (nn50 / (intervals.length - 1)) * 100;
  }

  private calculateTriangularIndex(intervals: number[]): number {
    const histogram = new Map<number, number>();
    const binSize = 8; // ms
    
    intervals.forEach(interval => {
      const bin = Math.floor(interval / binSize);
      histogram.set(bin, (histogram.get(bin) || 0) + 1);
    });
    
    const maxBinCount = Math.max(...histogram.values());
    return intervals.length / (maxBinCount + 1);
  }

  private calculateLightLevel(): number {
    return this.qualityBuffer.reduce((a, b) => a + b, 0) / 
           Math.max(this.qualityBuffer.length, 1);
  }

  private calculateCoverage(): number {
    return this.fingerDetector.detectFinger(this.lastImageData).confidence;
  }

  private estimateTemperature(): number {
    return 20 + this.calculateLightLevel() * 10;
  }

  private handleNoFinger() {
    this.peakBuffer.length = 0;
    this.timeBuffer.length = 0;
    this.qualityBuffer.length = 0;
    this.beepPlayer.stop();
  }

  private updateBuffers(signal: number, quality: number, timestamp: number) {
    this.qualityBuffer.push(quality);
    if (this.qualityBuffer.length > this.bufferSize) {
      this.qualityBuffer.shift();
    }
  }

  private getEmptyHRVMetrics(): HRVMetrics {
    return {
      sdnn: 0,
      rmssd: 0,
      pnn50: 0,
      triangularIndex: 0
    };
  }

  // OPTIMIZACIÓN: Limpieza mejorada
  stop() {
    this.beepPlayer.stop();
    this.handleNoFinger();
  }
}
