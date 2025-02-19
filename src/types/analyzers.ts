
import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { ValidationResult } from './core';
import { SpectralAnalysis } from './spectral';
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

export interface BeatMorphology {
  width: number;
  amplitude: number;
  slope: number;
  area: number;
  symmetry: number;
  dispose(): void;
}

export interface BeatValidation extends ValidationResult {
  timing: boolean;
  morphology: boolean;
  physiological: boolean;
}

export interface IntervalAnalysis {
  mean: number;
  std: number;
  variability: number;
  regularity: number;
}

export interface BeatClassification {
  type: string;
  confidence: number;
  features: Float64Type;
}

export interface BeatSegmentation {
  segments: Float64Type[];
  boundaries: number[];
  quality: number[];
}

export interface AdaptiveThreshold {
  value: number;
  history: number[];
  adaptation: number;
}

export interface PeakEnhancement {
  window: number;
  order: number;
  method: string;
}

export interface BPConfig {
  sampleRate: number;
  windowSize: number;
  method: string;
  calibration: CalibrationConfig;
  validation: ValidationConfig;
}

export interface CalibrationConfig {
  duration: number;
  samples: number;
  reference: {
    systolic: number;
    diastolic: number;
  };
}

export interface ValidationConfig {
  minQuality: number;
  maxError: number;
}

export interface WaveletBasis {
  level: number;
  detail: Float64Array;
  approximation: Float64Array;
}

export interface WaveletCoefficients {
  approximation: Float64Array;
  details: Float64Array[];
  level: number;
  coefficients?: Float64Array[];
  bases?: Float64Array[];
  space?: Float64Array[];
}

// Re-export common analyzer types
export * from './beat';
export * from './quality';
export * from './spectral';
