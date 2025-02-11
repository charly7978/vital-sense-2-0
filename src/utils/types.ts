export interface VitalReading {
  [key: string]: number;
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
  isPeak?: boolean;
  signalQuality: number;
  hrvMetrics?: {
    sdnn: number;
    rmssd: number;
    pnn50: number;
    lfhf: number;
  };
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
  user_id?: string;
}
