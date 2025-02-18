
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
}

export interface BloodPressure {
  systolic: number;
  diastolic: number;
}

export type ArrhythmiaType = 'Normal' | 'Irregular' | 'Unknown' | 'Fibrilación Auricular' | 'Extrasístoles';

export interface SignalConditions {
  brightness: number;
  stability: number;
  quality: number;
  signalQuality: number;
  lightLevel: number;
  movement: number;
  coverage: number;
  measurementType: string;
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
}

export interface ExtendedMediaTrackSettings extends MediaTrackSettings {
  brightness?: number;
  contrast?: number;
  saturation?: number;
}
