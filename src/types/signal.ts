
import { SignalQualityLevelType, Float64Type } from './common';
import type { Metadata, ValidationResult } from './core';

export interface SignalPoint extends Metadata {
  value: Float64Type;
  quality?: SignalQualityLevelType;
}

export interface SignalSegment {
  start: number;
  end: number;
  data: Float64Type;
  quality: SignalQualityLevelType;
}

export interface SignalMetrics {
  mean: number;
  std: number;
  snr: number;
  power: number;
  quality: SignalQualityLevelType;
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
}

