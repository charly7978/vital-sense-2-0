export interface VitalReading {
  timestamp: number;
  value: number;
  isPeak?: boolean;
  [key: string]: any;
}

export interface PPGData {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  hasArrhythmia: boolean;
  arrhythmiaType: ArrhythmiaType;
  confidence: number;
  readings: VitalReading[];
  isPeak?: boolean;
  signalQuality: number;
  timestamp: number;
  value: number;
  quality?: number;
}

export interface SensitivitySettings {
  signalAmplification: number;
  noiseReduction: number;
  peakDetection: number;
  heartbeatThreshold: number;
  responseTime: number;
  signalStability: number;
  brightness?: number;
  redIntensity?: number;
  [key: string]: number | undefined;
}

export interface VitalSigns {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  quality?: number;
  hasArrhythmia?: boolean;
  arrhythmiaType?: ArrhythmiaType;
}

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export type ArrhythmiaType = 'Normal' | 'Irregular' | 'Unknown' | 'Fibrilación Auricular' | 'Extrasístoles';

export type MeasurementType = 'bpm' | 'spo2' | 'systolic' | 'diastolic';

export interface CalibrationEntry {
  raw: number;
  calibrated: number;
  conditions: SignalConditions;
  factor: number;
  timestamp: number;
}

export interface CalibratedResult {
  value: number;
  confidence: number;
  factor: number;
}

export interface SignalConditions {
  brightness: number;
  stability: number;
  quality: number;
  signalQuality: number;
  lightLevel: number;
  movement: number;
  coverage: number;
  measurementType: MeasurementType;
  temperature?: number;
}

export interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  brightness?: {
    max: number;
    min: number;
    step: number;
  };
  contrast?: {
    max: number;
    min: number;
    step: number;
  };
  saturation?: {
    max: number;
    min: number;
    step: number;
  };
  sharpness?: {
    max: number;
    min: number;
    step: number;
  };
  exposureTime?: {
    max: number;
    min: number;
    step: number;
  };
  exposureMode?: string[];
  exposureCompensation?: {
    max: number;
    min: number;
    step: number;
  };
  whiteBalance?: string[];
}

export interface ExtendedMediaTrackSettings extends MediaTrackSettings {
  brightness?: number;
  contrast?: number;
  saturation?: number;
  sharpness?: number;
  exposureTime?: number;
  exposureMode?: string;
  exposureCompensation?: number;
  whiteBalance?: string;
}

export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width?: number | { ideal: number };
  height?: number | { ideal: number };
  frameRate?: number | { ideal: number };
  facingMode?: string | { ideal: string };
}
