
import { Float64Type } from './common';
import { Metadata, ValidationResult } from './core';
import { SignalQuality } from './quality';

export interface SignalSegment {
  data: Float64Type;
  metadata: Metadata;
  validation: ValidationResult;
}

export interface SignalPoint {
  value: Float64Type;
  timestamp: number;
  quality: number;
}

export interface SignalMetrics {
  mean: number;
  std: number;
  snr: number;
  power: number;
  quality: number;
}

export interface SignalValidation extends ValidationResult {
  stability: number;
  artifacts: number;
  coverage: number;
  quality?: SignalQuality;
}

export interface SignalFeatures {
  temporal: Float64Type;
  spectral: Float64Type;
  statistical: Float64Type;
  morphological?: Float64Type;
  wavelet?: Float64Type;
  quality: number;
}
