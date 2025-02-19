
// Tipos numéricos básicos
export type Float64Type = number[];
export type Float32Type = number[];

// Tipos básicos
export type ProcessingMode = 'normal' | 'calibration' | 'debug';
export type ColorSpace = 'rgb' | 'yuv' | 'hsv';
export type MeasurementType = 'ppg' | 'bp' | 'spo2' | 'resp';

// Interfaces básicas
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
