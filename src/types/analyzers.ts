
import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { ValidationResult } from './core';
import { SpectralAnalysis, WaveletAnalysis } from './analysis';
import { CalibrationState } from './calibration';

export interface BaseAnalyzer {
  initialize(): void;
  dispose(): void;
  validateInput(input: Float64Type): boolean;
  handleError(error: Error): void;
  updateState(state: any): void;
}

export interface SignalCalibration {
  validate(): boolean;
  reset(): void;
  isCalibrating: boolean;
  progress: number;
  message: string;
  isCalibrated: boolean;
  calibrationTime: number;
  referenceValues: Float64Type;
  calibrationQuality: number;
  enabled: boolean;
  duration: number;
  reference: Float64Type;
  lastCalibration: number;
  quality?: number;
  processingTime?: number;
  isValid?: boolean;
}

export interface ProcessorOptimization {
  vectorization: boolean;
  parallelization: boolean;
  precision: 'single' | 'double';
  cacheSize: number;
  adaptiveWindow: boolean;
}

export interface ProcessingQuality extends SignalQuality {
  temporal: number;
  spectral: number;
  wavelet?: number;
  artifacts: number;
}

export interface BPConfig {
  sampleRate: number;
  windowSize: number;
  method: 'PTT' | 'PAT' | 'PWV';
  calibration: {
    duration: number;
    samples: number;
    reference: {
      systolic: number;
      diastolic: number;
    };
  };
  validation?: {
    minQuality: number;
    maxError: number;
  };
}

export interface BPEstimation {
  timestamp: number;
  systolic: number;
  diastolic: number;
  map: number;
  confidence: number;
  quality: ProcessingQuality;
}

export interface WaveletCoefficients {
  approximation: Float64Array;
  details: Float64Array[];
  level: number;
  coefficients?: Float64Array[];
  bases?: Float64Array[];
  space?: Float64Array[];
}

export interface ArtifactConfig {
  enabled: boolean;
  threshold: number;
  window: number;
  features: string[];
  fusion: string;
  windowSize?: number;
  overlapSize?: number;
  motion: {
    enabled: boolean;
    threshold: number;
    window: number;
    features: string[];
    fusion: string;
  };
  noise: {
    enabled: boolean;
    methods: string[];
    thresholds: Record<string, number>;
  };
  spectral: {
    enabled: boolean;
    method: string;
    window: string;
    segments: number;
    overlap: number;
    bands: number[][];
  };
}
