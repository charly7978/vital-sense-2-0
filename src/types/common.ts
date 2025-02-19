
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

// Basic interfaces with dispose capability
export interface BasicMetrics extends Disposable {
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

