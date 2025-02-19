
export interface CalibrationEntry {
  timestamp: number;
  values: number[];
  conditions: SignalConditions;
  factor: number;
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
}
