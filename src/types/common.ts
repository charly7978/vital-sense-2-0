
// Numeric types
export type Float64Type = Float64Array; 
export type Float32Type = Float32Array;

// Basic types
export type ProcessingMode = 'normal' | 'calibration' | 'debug';
export type ColorSpace = 'rgb' | 'yuv' | 'hsv';
export type MeasurementType = 'ppg' | 'bp' | 'spo2' | 'resp';
export type SignalQualityLevelType = 'excellent' | 'good' | 'fair' | 'poor' | 'invalid';

export interface Disposable {
  dispose(): void;
}

export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width?: { ideal: number };
  height?: { ideal: number };
  facingMode?: 'user' | 'environment';
  frameRate?: { ideal: number };
  exposureMode?: 'auto' | 'manual';
  advanced?: MediaTrackConstraintSet[];
}

export interface BasicMetrics extends Disposable {
  timestamp: number;
  value: number;
  confidence: number;
}

export interface ROI {
  x: number;
  width: number;
  y: number;
  height: number;
}
