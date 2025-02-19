
import { Float64Type } from './common';
import { SignalConditions } from './vitals';

export interface CalibrationEntry {
  timestamp: number;
  value: number;
  conditions: SignalConditions;
  raw?: number;
  factor?: number;
  calibrated?: number;
}

export interface CalibratedResult {
  isCalibrated: boolean;
  value: number;
  confidence: number;
  reference: Float64Type;
  factor?: number;
}

export interface CalibrationState {
  isCalibrating: boolean;
  progress: number;
  message: string;
  isCalibrated: boolean;
  calibrationTime: number;
  referenceValues: Float64Type;
  calibrationQuality: number;
  lastCalibration?: number;
  enabled: boolean;
  duration: number;
  reference: Float64Type;
}

export interface ProcessingConfig {
  mode: 'normal' | 'calibration' | 'debug';
  sampleRate: number;
  bufferSize: number;
  enabled: boolean;
  duration: number;
  reference: Float64Type;
  calibration: {
    enabled: boolean;
    duration: number;
    reference: Float64Type;
  };
}

export interface SensitivitySettings {
  [key: string]: any;
  brightness: number;
  redIntensity: number;
  signalAmplification: number;
}
