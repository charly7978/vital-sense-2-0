
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

export interface VitalReading {
  timestamp: number;
  value: number;
  quality: number;
  type: MeasurementType;
}

export interface DeviceInfo {
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
  lightLevel: Percent;
}

export interface SignalQuality {
  level: SignalQualityLevel;
  score: number;
  confidence: number;
  overall: number;
  history: number[];
  dispose?: () => void;
}

export interface MotionAnalysis {
  displacement: number[];
  velocity: number[];
  acceleration: number[];
  dispose?: () => void;
}

export interface NoiseAnalysis {
  snr: number;
  distribution: number[];
  spectrum: number[];
  entropy: number;
  kurtosis: number;
  variance: number;
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

// Helper functions
export const createPercent = (n: number): Percent => Math.max(0, Math.min(100, n)) as Percent;
export const createBPM = (n: number): BPM => Math.max(0, Math.min(300, n)) as BPM;
export const createMilliseconds = (n: number): Milliseconds => Math.max(0, n) as Milliseconds;
