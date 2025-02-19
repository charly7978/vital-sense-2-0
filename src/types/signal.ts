
import { Float64Type } from './common';
import { Metadata, ValidationResult } from './core';

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
  temperature?: number;
}
