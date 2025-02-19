
import { SignalQualityLevel, Disposable } from './common';
import { NoiseAnalysis, MotionAnalysis } from './analysis';

export interface SignalQuality extends Disposable {
  level: SignalQualityLevel;
  score: number;
  confidence: number;
  overall: number;
  history: number[];
  signal?: number;
  noise?: number;
  movement?: number;
  threshold?: number;
}

export interface QualityConfig {
  snrThreshold: number;
  stabilityWindow: number;
  noiseThreshold: number;
  windowSize?: number;
  analysisParams?: {
    fftSize: number;
    overlap: number;
  };
  validation?: {
    minConfidence: number;
    maxArtifacts: number;
    minAmplitude?: number;
    waveformStability?: number;
  };
  wavelet?: {
    decompositionLevel: number;
    waveletType: string;
    type?: string;
    levels?: number;
  };
}

export interface CalibrationState {
  isCalibrating: boolean;
  progress: number;
  message: string;
  isCalibrated?: boolean;
  calibrationTime?: number;
  lastCalibration?: number;
  referenceValues?: Float64Array;
  calibrationQuality?: number;
}

export interface SignalConditions {
  brightness: number;
  contrast: number;
  noise: number;
  stability: number;
  signalQuality: number;
  lightLevel: number;
  movement: number;
  coverage: number;
  temperature: number;
  measurementType?: string;
}

export interface CalibrationEntry {
  timestamp: number;
  values: Float64Array;
  conditions: SignalConditions;
  quality: number;
  factor: number;
  raw?: number;
}

export interface CalibratedResult {
  value?: number;
  confidence: number;
  factor: number;
}

export interface ArtifactConfig {
  threshold: number;
  windowSize: number;
  mode: 'default' | 'strict' | 'lenient';
  validation?: {
    minConfidence: number;
    maxArtifacts: number;
    minAmplitude?: number;
  };
  wavelet?: {
    decompositionLevel: number;
    waveletType: string;
    type?: string;
  };
}
