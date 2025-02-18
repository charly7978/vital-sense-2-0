export interface VitalReading {
  timestamp: number;
  value: number;
  isPeak?: boolean;
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
  timestamp: number;
  value: number;
  quality?: number; // Añadido para compatibilidad
}

export interface VitalReading {
  timestamp: number;
  value: number;
  isPeak?: boolean;
  [key: string]: any; // Permite propiedades adicionales
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
  [key: string]: any; // Permite propiedades adicionales
}

export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width?: number | { ideal: number };
  height?: number | { ideal: number };
  facingMode?: string;
  frameRate?: number | { ideal: number };
  aspectRatio?: number | { ideal: number };
  whiteBalance?: { ideal: string };
  exposureMode?: { ideal: string };
  exposureCompensation?: { ideal: number };
}

export type VitalSigns = {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
};

export type BloodPressure = {
  systolic: number;
  diastolic: number;
};

export type ArrhythmiaType = 'Normal' | 'Irregular' | 'Unknown';

export type SignalConditions = {
  brightness: number;
  stability: number;
  quality: number;
};
