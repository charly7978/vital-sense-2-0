
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

export interface UserCalibration extends CalibrationData {
  id: string;
  userId: string;
  isActive: boolean;
  calibrationConstants: any;
  lastCalibrationQuality: number;
  calibrationHistory: any[];
}

