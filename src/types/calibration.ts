
// IMPORTANTE: NO MODIFICAR FUNCIONALIDAD
// Este archivo solo contiene definiciones de tipos

import { SignalConditions } from './signal';

export interface CalibrationEntry {
  timestamp: number;
  values: number[];
  conditions: SignalConditions;
  factor: number;
  raw?: number[];
}

export interface CalibratedResult {
  values: number[];
  quality: number;
  isValid: boolean;
}

export interface CalibrationState {
  isCalibrating: boolean;
  progress: number;
  message: string;
  isCalibrated?: boolean;
  calibrationTime?: number;
  referenceValues?: Float64Array;
  calibrationQuality?: number;
  lastCalibration?: number;
  duration?: number;
}
