
export interface VitalReading {
  timestamp: number;
  value: number;
  isPeak?: boolean;
  [key: string]: any; // Permite propiedades adicionales
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

export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width?: number | { ideal: number };
  height?: number | { ideal: number };
  facingMode?: string;
  frameRate?: number | { ideal: number };
  aspectRatio?: number | { ideal: number };
  advanced?: MediaTrackConstraintSet[];
}

export interface VitalSigns {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
}

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export type ArrhythmiaType = 'Normal' | 'Irregular' | 'Unknown';

export interface SignalConditions {
  brightness: number;
  stability: number;
  quality: number;
}
