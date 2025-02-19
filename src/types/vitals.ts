
import { SignalQuality } from './quality';
import { Float64Type } from './common';

export interface ProcessingState {
  isProcessing: boolean;
  frameCount: number;
  buffer: Float64Array;
  timeBuffer: Float64Array;
  lastTimestamp: number;
  sampleRate: number;
  calibration: {
    isCalibrating: boolean;
    progress: number;
    message: string;
    isCalibrated: boolean;
    calibrationTime: number;
    referenceValues: Float64Array;
    calibrationQuality: number;
  };
  quality: SignalQuality;
  optimization: {
    cache: Map<string, any>;
    performance: Map<string, number>;
    resources: Map<string, any>;
  };
}

export interface VitalReading {
  [key: string]: any;
  value: number;
  timestamp: number;
  confidence: number;
  quality?: SignalQuality;
}

export interface PPGData {
  timestamp: number;
  values: number[];
  bpm: number;
  confidence: number;
  quality?: SignalQuality;
}

export interface PPGProcessingConfig {
  mode: 'normal' | 'calibration' | 'debug';
  sampleRate: number;
  bufferSize: number;
  sensitivity: SensitivitySettings;
  filter: {
    enabled: boolean;
    lowCut: number;
    highCut: number;
    order: number;
  };
  filterOrder?: number;
  lowCutoff?: number;
  highCutoff?: number;
  peakThreshold?: number;
  minPeakDistance?: number;
  adaptiveThreshold?: boolean;
  calibrationDuration?: number;
  filterCoefficients?: Float64Type;
  calibration?: {
    enabled: boolean;
    duration: number;
    reference: Float64Type;
  };
}

export interface SensitivitySettings {
  [key: string]: any;
  brightness: number;
  redIntensity: number;
  signalAmplification: number;
  noiseReduction?: number;
  peakDetection?: number;
  heartbeatThreshold?: number;
  responseTime?: number;
  signalStability?: number;
}

export type MeasurementType = 'ppg' | 'bp' | 'spo2' | 'resp';

export interface SignalConditions {
  noiseLevel: number;
  motionArtifacts: boolean;
  signalStrength: number;
  lighting: 'good' | 'poor' | 'invalid';
  signalQuality: number;
  lightLevel: number;
  movement: number;
  coverage: number;
  temperature: number;
  stability: number;
  measurementType: MeasurementType;
}

export interface VitalSigns {
  bpm: number;
  spo2?: number;
  respirationRate?: number;
  bloodPressure?: BloodPressure;
  quality: SignalQuality;
  timestamp: number;
}

export interface BloodPressure {
  systolic: number;
  diastolic: number;
  mean: number;
}

export type ArrhythmiaType = 'normal' | 'bradycardia' | 'tachycardia' | 'irregular';
