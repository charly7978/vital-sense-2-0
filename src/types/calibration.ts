
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
  enabled: boolean;
  duration: number;
  reference: Float64Type;
  lastCalibration?: number;
}

export interface ProcessingConfig {
  mode: 'normal' | 'calibration' | 'debug';
  sampleRate: number;
  bufferSize: number;
  enabled: boolean;
  duration: number;
  reference: Float64Type;
  calibration: CalibrationState;
  filterOrder?: number;
  lowCutoff?: number;
  highCutoff?: number;
  peakThreshold?: number;
  minPeakDistance?: number;
  calibrationDuration?: number;
  adaptiveThreshold?: boolean;
  harmonics?: {
    enabled: boolean;
    maxHarmonics: number;
    minAmplitude: number;
    tracking?: boolean;
  };
  filter?: {
    enabled: boolean;
    lowCut: number;
    highCut: number;
    order: number;
    nfft?: number;
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
  snr?: number;
}

export interface CalibrationInterface extends CalibrationState {
  dispose(): void;
}
