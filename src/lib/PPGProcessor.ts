import { 
  PPGData, ProcessingMode, SensitivitySettings, 
  FingerDetection, DeviceInfo, CalibrationState,
  ProcessorEvent, SignalQualityLevel,
  ProcessingConfig, ProcessingState, QualityParams,
  ProcessorMetrics, CircularBuffer, WaveletFeatures
} from '@/types';

import { SignalFilter } from './SignalFilter';
import { FingerDetector } from './FingerDetector';
import { WaveletAnalyzer } from './WaveletAnalyzer';
import { HeartRateEstimator } from './HeartRateEstimator';
import { MovementCompensator } from './MovementCompensator';
import { BeepPlayer } from './BeepPlayer';

export class PPGProcessor {
  private readonly config: ProcessingConfig;
  private readonly signalFilter: SignalFilter;
  private readonly fingerDetector: FingerDetector;
  private readonly waveletAnalyzer: WaveletAnalyzer;
  private readonly hrEstimator: HeartRateEstimator;
  private readonly movementCompensator: MovementCompensator;
  private readonly beepPlayer: BeepPlayer;
  private state: ProcessingState;
  private metrics: ProcessorMetrics;

  constructor() {
    this.config = {
      mode: 'normal',
      sensitivity: {
        brightness: 1.0,
        redIntensity: 1.0,
        signalAmplification: 1.0,
        noiseReduction: 0.5,
        peakDetection: 0.7,
        heartbeatThreshold: 0.6,
        responseTime: 500,
        signalStability: 0.8
      },
      calibration: {
        isCalibrating: false,
        progress: 0,
        message: ''
      }
    };

    this.state = {
      isProcessing: false,
      frameCount: 0,
      quality: {
        level: SignalQualityLevel.Invalid,
        score: 0,
        confidence: 0
      },
      calibration: this.config.calibration
    };

    this.metrics = {
      frameRate: 0,
      processingTime: 0,
      memoryUsage: 0,
      quality: this.state.quality
    };

    this.initializeComponents();
  }

  private initializeComponents(): void {
    this.signalFilter = new SignalFilter();
    this.fingerDetector = new FingerDetector();
    this.waveletAnalyzer = new WaveletAnalyzer();
    this.hrEstimator = new HeartRateEstimator();
    this.movementCompensator = new MovementCompensator();
    this.beepPlayer = new BeepPlayer();
  }

  public startCalibration(): void {
    this.state.calibration = {
      ...this.state.calibration,
      isCalibrating: true,
      progress: 0,
      message: 'Starting calibration...'
    };
  }

  public processFrame(frame: ImageData): PPGData {
    if (!this.state.isProcessing) {
      return this.getEmptyResult('Not processing');
    }

    const fingerDetection = this.detectFinger(frame);
    if (!fingerDetection.quality) {
      return this.getEmptyResult('No finger detected');
    }

    const signal = this.extractSignal(frame, fingerDetection);
    const processedSignal = this.processSignal(signal);
    const features = this.analyzeSignal(processedSignal);
    const heartRate = this.estimateHeartRate(features);

    this.updateMetrics({
      frame,
      signal,
      features,
      heartRate
    });

    return this.generateResult(heartRate, fingerDetection);
  }

  private getEmptyResult(message: string): PPGData {
    return {
      timestamp: Date.now(),
      bpm: 0,
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      perfusionIndex: 0,
      respiratoryRate: 0,
      stressIndex: 0,
      arrhythmia: null,
      quality: 0,
      message,
      features: {},
      fingerDetection: {
        quality: 0,
        coverage: 0
      },
      deviceInfo: {
        frameRate: 0,
        resolution: { width: 0, height: 0 },
        lightLevel: 0
      }
    };
  }

  public stop(): void {
    this.state.isProcessing = false;
    this.cleanupResources();
  }

  private cleanupResources(): void {
    this.signalFilter?.stop?.();
    this.fingerDetector?.stop?.();
    this.waveletAnalyzer?.stop?.();
    this.hrEstimator?.stop?.();
    this.movementCompensator?.stop?.();
    this.beepPlayer?.stop?.();
  }

  // Métodos auxiliares privados
  private validateFrame(frame: ImageData): boolean {
    return frame && frame.data && frame.width > 0 && frame.height > 0;
  }

  private validateSignal(signal: number[]): boolean {
    return signal && signal.length > 0 && !signal.some(isNaN);
  }

  private canRecover(): boolean {
    return this.state.errorCount < 3;
  }

  private attemptRecovery(): PPGData {
    this.resetState();
    return this.getEmptyResult('Recuperando...');
  }

  private calculateFrameRate(): number {
    const elapsed = (Date.now() - this.state.startTime) / 1000;
    return this.state.frameCount / elapsed;
  }

  private calculateErrorRate(): number {
    return this.state.errorCount / this.state.frameCount;
  }

  private resetState(): void {
    this.state = {
      isProcessing: false,
      calibrationPhase: 'initial',
      lastProcessingTime: 0,
      frameCount: 0,
      validFrames: 0,
      errorCount: 0,
      startTime: 0,
      lastHeartRate: 0,
      stability: 0,
      confidence: 0
    };
  }
}
