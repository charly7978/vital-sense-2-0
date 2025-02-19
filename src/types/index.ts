
// Base types
export type Percent = number & { __brand: 'Percent' };
export type BPM = number & { __brand: 'BPM' };
export type Milliseconds = number & { __brand: 'Milliseconds' };

// Signal Quality types
export enum SignalQualityLevel {
  Excellent = 'excellent',
  Good = 'good',
  Fair = 'fair',
  Poor = 'poor',
  Invalid = 'invalid'
}

// Measurement types
export type MeasurementType = 'ppg' | 'bp' | 'spo2' | 'resp';

export interface PPGData {
  timestamp: number;
  values: number[];
  bpm: number;
  confidence: number;
}

export interface SignalQuality {
  level: SignalQualityLevel;
  score: number;
  confidence: number;
  overall: number;
  history: number[];
  dispose?: () => void;
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

export interface NoiseAnalysis {
  snr: number;
  distribution: number[];
  spectrum: number[];
  entropy: number;
  kurtosis: number;
  variance: number;
  spectralNoise?: number;
  threshold?: number;
  dispose?: () => void;
}

export interface MotionAnalysis {
  displacement: number[];
  velocity: number[];
  acceleration: number[];
  features?: any[];
  dispose?: () => void;
}

// Artifact Detection types
export interface ArtifactConfig {
  threshold: number;
  windowSize: number;
  mode: 'default' | 'strict' | 'lenient';
}

export interface ArtifactDetection {
  isArtifact: boolean;
  confidence: number;
  type?: string;
}

export interface ArtifactFeatures {
  motion: MotionAnalysis;
  noise: NoiseAnalysis;
  quality: SignalQuality;
}

// Signal Processing types
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

export interface SensitivitySettings {
  brightness: number;
  redIntensity: number;
  signalAmplification: number;
  noiseReduction: number;
  peakDetection: number;
  heartbeatThreshold: number;
  responseTime: number;
  signalStability: number;
}

// Camera types
export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width?: { ideal: number };
  height?: { ideal: number };
  facingMode?: 'user' | 'environment';
  frameRate?: number;
  exposureMode?: string;
  exposureTime?: number;
  exposureCompensation?: number;
  brightness?: number;
  contrast?: number;
  whiteBalanceMode?: string;
  colorTemperature?: number;
  saturation?: number;
  sharpness?: number;
  torch?: boolean;
}

// Analysis types
export interface SpectralAnalysis {
  spectrum: Float64Array;
  frequencies: Float64Array;
  magnitude: Float64Array;
  phase: Float64Array;
  dispose?: () => void;
}

export interface WaveletAnalysis {
  coefficients: Float64Array;
  levels: number;
  features: {
    energy: number[];
    entropy: number[];
  };
  dispose?: () => void;
}

// Template matching types
export interface TemplateMatching {
  similarity: number;
  offset: number;
  scale: number;
}

// Filter types
export interface FilterConfig {
  order: number;
  cutoff: number[];
  type: 'lowpass' | 'highpass' | 'bandpass';
}

export interface FilterResponse {
  magnitude: Float64Array;
  phase: Float64Array;
  frequencies: Float64Array;
}

// Helper functions
export const createPercent = (n: number): Percent => Math.max(0, Math.min(100, n)) as Percent;
export const createBPM = (n: number): BPM => Math.max(0, Math.min(300, n)) as BPM;
export const createMilliseconds = (n: number): Milliseconds => Math.max(0, n) as Milliseconds;
