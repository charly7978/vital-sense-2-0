
export interface VitalReading {
  [key: string]: number;  // Add index signature to make it JSON compatible
  timestamp: number;
  value: number;
}

export interface PPGData {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  hasArrhythmia: boolean;
  arrhythmiaType: string;
  confidence: number;
  readings: VitalReading[];
}

export interface CalibrationData {
  age: number;
  height: number;
  weight: number;
  systolic: number;
  diastolic: number;
  deviceType: string;
  calibrationDate?: Date;
}

// Updated to match database schema
export interface UserCalibration {
  id: string;
  age: number;
  height: number;
  weight: number;
  systolic: number;
  diastolic: number;
  deviceType: string;
  is_active: boolean;
  calibration_constants: any;
  calibration_history: any[];
  last_calibration_quality: number;
  calibration_date?: string;
}
