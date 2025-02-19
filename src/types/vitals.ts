
import { SignalQuality } from './quality';
import { Float64Type } from './common';

export interface VitalReading {
  [key: string]: any;  // Add index signature
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
  quality?: SignalQuality; // Add quality field
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
}

export interface SensitivitySettings {
  [key: string]: any;  // Add index signature
  brightness: number;
  redIntensity: number;
  signalAmplification: number;
  noiseReduction?: number;
  peakDetection?: number;
  heartbeatThreshold?: number;
  responseTime?: number;
  signalStability?: number;
}

export interface ProcessingState {
  isProcessing: boolean;
  frameCount: number;
  buffer: Float64Type;
  timeBuffer: Float64Type;
  lastTimestamp: number;
  sampleRate: number;
  calibration: {
    isCalibrating: boolean;
    progress: number;
    message: string;
    isCalibrated: boolean;
    calibrationTime: number;
    referenceValues: Float64Type;
    calibrationQuality: number;
  };
  quality: SignalQuality;
  optimization: {
    cache: Map<string, any>;
    performance: Map<string, number>;
    resources: Map<string, any>;
  };
}

// Add new types for PPG analysis
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

export interface SignalConditions {
  noiseLevel: number;
  motionArtifacts: boolean;
  signalStrength: number;
  lighting: 'good' | 'poor' | 'invalid';
}
