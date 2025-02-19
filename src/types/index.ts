
// Base types
export type Percent = number & { __brand: 'Percent' };
export type BPM = number & { __brand: 'BPM' };
export type Milliseconds = number & { __brand: 'Milliseconds' };

// Signal Processing Types
export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width?: { ideal: number };
  height?: { ideal: number };
  facingMode?: 'user' | 'environment';
  frameRate?: { ideal: number };
  advanced?: MediaTrackConstraintSet[];
}

// Signal Quality Types
export enum SignalQualityLevel {
  Excellent = 'excellent',
  Good = 'good',
  Fair = 'fair',
  Poor = 'poor',
  Invalid = 'invalid'
}

export type MeasurementType = 'ppg' | 'bp' | 'spo2' | 'resp';

export interface SignalQuality {
  level: SignalQualityLevel;
  score: number;
  confidence: number;
  overall: number;
  history: number[];
  signal?: number;
  noise?: number;
  movement?: number;
  threshold?: number;
  dispose?: () => void;
}

// Frequency Analysis Types
export interface FrequencyConfig {
  sampleRate: number;
  windowSize: number;
  fftSize: number;
  overlap: number;
  method: 'welch' | 'fft';
}

export interface FrequencyBands {
  vlf: [number, number];
  lf: [number, number];
  hf: [number, number];
  total: [number, number];
}

export interface FrequencyMetrics {
  power: number[];
  frequency: number[];
  amplitude: number[];
  phase: number[];
}

export interface SpectralAnalysis {
  spectrum: Float64Array;
  frequencies: Float64Array;
  magnitude: Float64Array;
  phase: Float64Array;
  bands?: FrequencyBands;
  dispose?: () => void;
}

export interface SpectralDensity {
  power: Float64Array;
  frequency: Float64Array;
}

export interface SpectralQuality {
  snr: number;
  coherence: number;
  stability: number;
}

// Wavelet Analysis Types
export interface WaveletAnalysis {
  coefficients: WaveletCoefficients;
  features: SubbandFeatures;
  levels: number;
  dispose?: () => void;
}

// Signal Processing Core Types
export interface ProcessingConfig {
  mode: 'normal' | 'calibration' | 'debug';
  sampleRate?: number;
  sensitivity: SensitivitySettings;
  calibration: CalibrationState;
  bufferSize: number;
  filterOrder: number;
  lowCutoff: number;
  highCutoff: number;
  peakThreshold: number;
  minPeakDistance: number;
  calibrationDuration: number;
  adaptiveThreshold: boolean;
}

export interface ProcessingState {
  isProcessing: boolean;
  frameCount: number;
  buffer: Float64Array;
  timeBuffer: Float64Array;
  lastTimestamp: number;
  sampleRate: number;
  calibration: CalibrationState;
  quality: SignalQuality;
  optimization: {
    cache: Map<string, any>;
    performance: Map<string, number>;
    resources: Map<string, number>;
  };
}

export interface CalibrationState {
  isCalibrating: boolean;
  progress: number;
  message: string;
  isCalibrated?: boolean;
  calibrationTime?: number;
  lastCalibration?: number;
  referenceValues?: Float64Array;
  calibrationQuality?: number;
}

// Filter Types
export interface FilterConfig {
  order: number;
  cutoff: number[];
  type: 'lowpass' | 'highpass' | 'bandpass';
  window?: 'hamming' | 'hanning' | 'blackman';
}

export interface FilterResponse {
  magnitude: Float64Array;
  phase: Float64Array;
  frequencies: Float64Array;
}

export interface FilterState {
  coefficients: Float64Array;
  memory: Float64Array;
}

export interface FilterQuality {
  snr: number;
  ripple: number;
  stability: number;
}

// Image Processing Types
export interface ImageConfig {
  width: number;
  height: number;
  channels: number;
  colorSpace: 'rgb' | 'yuv' | 'hsv';
}

export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ColorProfile {
  mean: number[];
  std: number[];
  histogram: number[][];
}

export interface ImageQuality {
  sharpness: number;
  brightness: number;
  contrast: number;
  noise: number;
}

// Motion Analysis Types
export interface MotionConfig {
  blockSize: number;
  searchRange: number;
  threshold: number;
}

export interface MotionVector {
  x: number;
  y: number;
  magnitude: number;
  angle: number;
}

export interface MotionMetrics {
  displacement: number;
  velocity: number;
  acceleration: number;
}

// Signal Quality Types
export interface QualityConfig {
  snrThreshold: number;
  stabilityWindow: number;
  noiseThreshold: number;
}

export interface QualityMetrics {
  snr: number;
  stability: number;
  noise: number;
  overall: number;
}

// Helper functions
export const createPercent = (n: number): Percent => Math.max(0, Math.min(100, n)) as Percent;
export const createBPM = (n: number): BPM => Math.max(0, Math.min(300, n)) as BPM;
export const createMilliseconds = (n: number): Milliseconds => Math.max(0, n) as Milliseconds;
