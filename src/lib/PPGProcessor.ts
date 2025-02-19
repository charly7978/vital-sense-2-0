import { 
  PPGData, 
  PPGProcessingConfig,
  ProcessingState,
  SignalQuality,
  NoiseAnalysis,
  MotionAnalysis,
  SignalQualityLevel,
  SignalQualityLevelType,
  Float64Type
} from '@/types';
import { config } from '../config';

export class PPGProcessor {
  private config: PPGProcessingConfig;
  private state: ProcessingState;
  private frameBuffer: Float64Type;
  private timeBuffer: Float64Type;
  private signalBuffer: Float64Type;
  private fftBuffer: Float64Type;
  private peakBuffer: Float64Type;
  private lastBPM: number = 0;
  
  constructor() {
    this.config = {
      mode: 'normal',
      sampleRate: config.processing.sampleRate,
      sensitivity: config.sensitivity,
      calibration: config.calibration,
      bufferSize: 512,
      filterOrder: 32,
      lowCutoff: 0.5,
      highCutoff: 4.0,
      peakThreshold: 0.3,
      minPeakDistance: 0.3,
      calibrationDuration: 5000,
      adaptiveThreshold: true
    };

    this.state = {
      isProcessing: false,
      frameCount: 0,
      buffer: new Float64Array(this.config.bufferSize),
      timeBuffer: new Float64Array(this.config.bufferSize),
      lastTimestamp: 0,
      sampleRate: this.config.sampleRate,
      calibration: { ...config.calibration },
      quality: {
        level: SignalQualityLevel.Invalid,
        score: 0,
        confidence: 0,
        overall: 0,
        history: []
      },
      optimization: {
        cache: new Map(),
        performance: new Map(),
        resources: new Map()
      }
    };

    this.frameBuffer = new Float64Array(this.config.bufferSize);
    this.timeBuffer = new Float64Array(this.config.bufferSize);
    this.signalBuffer = new Float64Array(this.config.bufferSize);
    this.fftBuffer = new Float64Array(this.config.bufferSize);
    this.peakBuffer = new Float64Array(this.config.bufferSize);
    
    this.initialize();
  }

  private initialize(): void {
    try {
      this.state.isProcessing = true;
      this.resetBuffers();
      this.initializeFilters();
    } catch (error) {
      console.error('Error initializing PPGProcessor:', error);
      throw error;
    }
  }

  private resetBuffers(): void {
    this.frameBuffer.fill(0);
    this.timeBuffer.fill(0);
    this.signalBuffer.fill(0);
    this.fftBuffer.fill(0);
    this.peakBuffer.fill(0);
    this.state.frameCount = 0;
    this.lastBPM = 0;
  }

  private initializeFilters(): void {
    const coefficients = this.designFilter();
    this.config = {
      ...this.config,
      filterCoefficients: coefficients
    };
  }

  private designFilter(): Float64Type {
    const coefficients = new Float64Array(this.config.filterOrder);
    const omega1 = 2 * Math.PI * this.config.lowCutoff / this.state.sampleRate;
    const omega2 = 2 * Math.PI * this.config.highCutoff / this.state.sampleRate;
    
    for (let n = 0; n < this.config.filterOrder; n++) {
      if (n === this.config.filterOrder / 2) {
        coefficients[n] = (omega2 - omega1) / Math.PI;
      } else {
        const k = n - this.config.filterOrder / 2;
        coefficients[n] = (Math.sin(omega2 * k) - Math.sin(omega1 * k)) / (Math.PI * k);
      }
      coefficients[n] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * n / this.config.filterOrder);
    }
    
    return coefficients;
  }

  public processFrame(imageData: ImageData): PPGData {
    try {
      if (!this.state.isProcessing) {
        throw new Error('Processor not initialized');
      }

      const timestamp = Date.now();
      const rawSignal = this.extractPPGSignal(imageData);
      
      this.updateBuffers(rawSignal, timestamp);
      const filteredSignal = this.filterSignal(this.signalBuffer);
      const peaks = this.detectPeaks(filteredSignal);
      const bpm = this.calculateBPM(peaks, timestamp);
      const quality = this.analyzeSignalQuality(filteredSignal);
      
      this.updateState(quality);

      if (this.state.calibration.isCalibrating) {
        this.updateCalibration(rawSignal);
      }

      return {
        timestamp,
        values: Array.from(filteredSignal),
        bpm,
        confidence: quality.confidence
      };
    } catch (error) {
      console.error('Error processing frame:', error);
      throw error;
    }
  }

  private extractPPGSignal(imageData: ImageData): number {
    let redSum = 0;
    let greenSum = 0;
    let pixelCount = 0;
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      redSum += imageData.data[i] * this.config.sensitivity.redIntensity;
      greenSum += imageData.data[i + 1];
      pixelCount++;
    }

    const redMean = redSum / pixelCount;
    const greenMean = greenSum / pixelCount;
    const signal = (redMean - greenMean) * this.config.sensitivity.signalAmplification;
    
    return signal;
  }

  private updateBuffers(signal: number, timestamp: number): void {
    // Shift buffers
    for (let i = 0; i < this.config.bufferSize - 1; i++) {
      this.signalBuffer[i] = this.signalBuffer[i + 1];
      this.timeBuffer[i] = this.timeBuffer[i + 1];
    }

    // Add new values
    this.signalBuffer[this.config.bufferSize - 1] = signal;
    this.timeBuffer[this.config.bufferSize - 1] = timestamp;
    this.state.frameCount++;
  }

  private filterSignal(signal: Float64Type): Float64Type {
    const filtered = new Float64Array(signal.length);
    const coeffs = this.config.filterCoefficients as Float64Type;
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      for (let j = 0; j < coeffs.length; j++) {
        if (i - j >= 0) {
          sum += coeffs[j] * signal[i - j];
        }
      }
      filtered[i] = sum;
    }
    
    return filtered;
  }

  private detectPeaks(signal: Float64Type): number[] {
    const peaks: number[] = [];
    const minDistance = this.config.minPeakDistance * this.state.sampleRate;
    const threshold = this.calculateAdaptiveThreshold(signal);

    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i - 1] && 
          signal[i] > signal[i + 1] && 
          signal[i] > threshold) {
        
        if (peaks.length === 0 || (i - peaks[peaks.length - 1]) >= minDistance) {
          peaks.push(i);
        }
      }
    }

    this.peakBuffer = peaks;
    return peaks;
  }

  private calculateAdaptiveThreshold(signal: Float64Type): number {
    if (!this.config.adaptiveThreshold) {
      return this.config.peakThreshold;
    }

    const mean = signal.reduce((a, b) => a + b) / signal.length;
    const std = Math.sqrt(
      signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length
    );

    return mean + std * this.config.peakThreshold;
  }

  private calculateBPM(peaks: number[], timestamp: number): number {
    if (peaks.length < 2) {
      return this.lastBPM;
    }

    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = this.timeBuffer[peaks[i]] - this.timeBuffer[peaks[i - 1]];
      if (interval > 0) {
        intervals.push(interval);
      }
    }

    if (intervals.length === 0) {
      return this.lastBPM;
    }

    // Calculate median interval
    intervals.sort((a, b) => a - b);
    const medianInterval = intervals[Math.floor(intervals.length / 2)];
    
    // Convert to BPM
    const bpm = 60000 / medianInterval;
    
    // Apply smoothing
    this.lastBPM = this.lastBPM * 0.7 + bpm * 0.3;
    
    return Math.round(this.lastBPM);
  }

  private analyzeSignalQuality(signal: Float64Type): SignalQuality {
    const noise = this.analyzeNoise(signal);
    const motion = this.analyzeMotion(signal);
    
    const snrScore = Math.min(Math.max(noise.snr / 10, 0), 1);
    const motionScore = 1 - Math.min(motion.displacement[0], 1);
    
    const quality: SignalQuality = {
      level: this.determineQualityLevel(snrScore, motionScore),
      score: (snrScore + motionScore) / 2,
      confidence: snrScore * motionScore,
      overall: (snrScore * 0.6 + motionScore * 0.4),
      history: [...this.state.quality.history, snrScore]
    };

    // Keep only last 30 quality scores
    if (quality.history.length > 30) {
      quality.history.shift();
    }

    return quality;
  }

  private analyzeNoise(signal: Float64Type): NoiseAnalysis {
    const { magnitude, phase } = this.computeFFT(signal);
    const mean = signal.reduce((a, b) => a + b) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    
    // Calculate signal and noise power
    const signalPower = magnitude.reduce((a, b) => a + b * b, 0);
    const noisePower = variance - signalPower;
    const snr = signalPower / (noisePower + 1e-10);

    return {
      snr,
      distribution: Array.from(magnitude),
      spectrum: Array.from(phase),
      entropy: this.calculateEntropy(magnitude),
      kurtosis: this.calculateKurtosis(signal, mean, Math.sqrt(variance)),
      variance
    };
  }

  private analyzeMotion(signal: Float64Type): MotionAnalysis {
    const displacement: number[] = [];
    const velocity: number[] = [];
    const acceleration: number[] = [];

    for (let i = 1; i < signal.length; i++) {
      displacement.push(Math.abs(signal[i] - signal[i - 1]));
      if (i > 1) {
        const v = displacement[i - 1] - displacement[i - 2];
        velocity.push(v);
        if (i > 2) {
          acceleration.push(v - velocity[velocity.length - 2]);
        }
      }
    }

    return {
      displacement,
      velocity,
      acceleration
    };
  }

  private computeFFT(signal: Float64Type): { magnitude: Float64Type, phase: Float64Type } {
    const n = signal.length;
    const magnitude = new Float64Array(n / 2);
    const phase = new Float64Array(n / 2);

    // Implementación básica de FFT
    for (let k = 0; k < n / 2; k++) {
      let re = 0;
      let im = 0;
      
      for (let t = 0; t < n; t++) {
        const angle = (2 * Math.PI * t * k) / n;
        re += signal[t] * Math.cos(angle);
        im -= signal[t] * Math.sin(angle);
      }
      
      magnitude[k] = Math.sqrt(re * re + im * im) / n;
      phase[k] = Math.atan2(im, re);
    }

    return { magnitude, phase };
  }

  private calculateEntropy(distribution: Float64Type): number {
    const sum = distribution.reduce((a, b) => a + b, 0);
    let entropy = 0;
    
    for (const value of distribution) {
      const p = value / sum;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }
    
    return entropy;
  }

  private calculateKurtosis(signal: Float64Type, mean: number, std: number): number {
    if (std === 0) return 0;
    
    const n = signal.length;
    const m4 = signal.reduce((a, b) => a + Math.pow(b - mean, 4), 0) / n;
    return m4 / Math.pow(std, 4) - 3;
  }

  private determineQualityLevel(score: number): SignalQualityLevelType {
    if (score > 0.8) return SignalQualityLevel.Excellent;
    if (score > 0.6) return SignalQualityLevel.Good;
    if (score > 0.4) return SignalQualityLevel.Fair;
    if (score > 0.2) return SignalQualityLevel.Poor;
    return SignalQualityLevel.Invalid;
  }

  private updateState(quality: SignalQuality): void {
    this.state.quality = quality;
  }

  public startCalibration(): void {
    this.state.calibration = {
      isCalibrating: true,
      progress: 0,
      message: 'Calibrating...',
      isCalibrated: false,
      calibrationTime: Date.now(),
      referenceValues: new Float64Array(this.config.bufferSize)
    };
  }

  private updateCalibration(rawSignal: number): void {
    if (!this.state.calibration.isCalibrating) return;

    this.state.calibration = {
      ...this.state.calibration,
      calibrationQuality: this.state.quality.overall,
      referenceValues: new Float64Array([...Array.from(this.state.calibration.referenceValues), rawSignal])
    };

    const progress = Math.min(
      (Date.now() - this.state.calibration.calibrationTime) / this.config.calibrationDuration,
      1
    );

    if (progress >= 1) {
      this.finalizeCalibration();
    }
  }

  private finalizeCalibration(): void {
    this.state.calibration.isCalibrating = false;
    this.state.calibration.isCalibrated = true;
    this.state.calibration.message = 'Calibration complete';
  }

  public stop(): void {
    this.state.isProcessing = false;
    this.resetBuffers();
    this.state.calibration.isCalibrating = false;
  }

  public getQuality(): SignalQuality {
    return this.state.quality;
  }

  public getCalibrationProgress(): number {
    return this.state.calibration.progress;
  }

  public isCalibrating(): boolean {
    return this.state.calibration.isCalibrating;
  }

  public isCalibrated(): boolean {
    return this.state.calibration.isCalibrated || false;
  }
}
