
// Basic enums
export const SignalQualityLevel = {
  Excellent: 'excellent',
  Good: 'good',
  Fair: 'fair',
  Poor: 'poor',
  Invalid: 'invalid'
} as const;

export type SignalQualityLevelType = typeof SignalQualityLevel[keyof typeof SignalQualityLevel];

// Basic numeric types
export type Float64Array = number[];

// Basic types
export type ProcessingMode = 'normal' | 'calibration' | 'debug';
export type ColorSpace = 'rgb' | 'yuv' | 'hsv';
export type MeasurementType = 'ppg' | 'bp' | 'spo2' | 'resp';

// Basic interfaces
export interface BasicMetrics {
  timestamp: number;
  value: number;
  confidence: number;
}

export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Media interfaces
export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width?: { ideal: number };
  height?: { ideal: number };
  facingMode?: 'user' | 'environment';
  frameRate?: { ideal: number };
  advanced?: MediaTrackConstraintSet[];
}

export interface Disposable {
  dispose?: () => void;
}
