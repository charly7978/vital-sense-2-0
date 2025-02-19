
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

export interface VitalReading {
  timestamp: number;
  value: number;
  quality: number;
  type: MeasurementType;
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

// Processing types
export interface ProcessorMetrics {
  snr: number;
  bpm: number;
  quality: SignalQuality;
  timestamp: number;
}

export interface RegionAnalysis {
  x: number;
  y: number;
  width: number;
  height: number;
  quality: number;
  coverage: number;
  stability: number;
}

// Helper functions
export const createPercent = (n: number): Percent => Math.max(0, Math.min(100, n)) as Percent;
export const createBPM = (n: number): BPM => Math.max(0, Math.min(300, n)) as BPM;
export const createMilliseconds = (n: number): Milliseconds => Math.max(0, n) as Milliseconds;
