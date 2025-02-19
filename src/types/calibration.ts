
import { SignalQualityLevelType, Float64Type } from './common';
import type { ValidationResult } from './core';

export interface CalibrationEntry {
  timestamp: number;
  value: number;
  reference?: number;
  confidence: number;
  quality: SignalQualityLevelType;
}

export interface CalibrationConditions {
  brightness: number;
  contrast: number;
  stability: number;
  coverage: number;
  quality: SignalQualityLevelType;
}

export interface CalibrationValidation extends ValidationResult {
  conditions: CalibrationConditions;
  threshold: number;
  duration: number;
}

export interface CalibratedResult {
  timestamp: number;
  value: number;
  reference: number;
  error: number;
  confidence: number;
}

export interface CalibrationConfig {
  duration: number;
  samples: number;
  reference?: number;
  threshold?: number;
  validation?: {
    minQuality: SignalQualityLevelType;
    maxError: number;
    minConfidence: number;
  };
}
