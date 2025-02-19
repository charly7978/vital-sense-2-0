
import { SignalConditions } from './vitals';
import { Float64Type } from './common';

export interface CalibrationEntry {
  timestamp: number;
  value: number;
  conditions: SignalConditions;
}

export interface CalibratedResult {
  isCalibrated: boolean;
  value: number;
  confidence: number;
  reference: Float64Type;
}

export interface CalibrationState {
  isCalibrating: boolean;
  progress: number;
  message: string;
  isCalibrated: boolean;
  calibrationTime: number;
  referenceValues: Float64Type;
  calibrationQuality: number;
}
