
// Basic numeric types and arrays
export type Float64Array = number[];

// Basic enums and types
export type ProcessingMode = 'normal' | 'calibration' | 'debug';
export type ColorSpace = 'rgb' | 'yuv' | 'hsv';
export type SignalQualityLevel = 'excellent' | 'good' | 'fair' | 'poor' | 'invalid';
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

export interface Disposable {
  dispose?: () => void;
}
