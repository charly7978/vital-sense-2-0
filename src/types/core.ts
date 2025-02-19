
import { SignalQualityLevelType, Float64Type } from './common';
import type { NoiseAnalysis, MotionAnalysis } from './analysis';
import type { CalibrationState } from './config';

// Base interfaces
export interface Metadata {
  timestamp: number;
  duration?: number;
  frameIndex?: number;
}

export interface DataPoint extends Metadata {
  value: number;
  confidence?: number;
}

export interface DataRange {
  start: number;
  end: number;
  step?: number;
}

export interface ProcessingResult extends Metadata {
  value: number;
  confidence: number;
  quality: SignalQualityLevelType;
}

export interface CalibrationResult {
  isValid: boolean;
  calibration: CalibrationState;
  referenceValue: number;
  confidence: number;
}

export interface AnalysisResult extends ProcessingResult {
  features: Float64Type;
  metrics: {[key: string]: number};
  quality: SignalQualityLevelType;
}

export interface ValidationResult {
  isValid: boolean;
  confidence: number;
  metrics: {[key: string]: number};
  details?: string[];
}

export interface DetectionResult extends ProcessingResult {
  artifacts?: NoiseAnalysis;
  motion?: MotionAnalysis;
  segments?: number[][];
}

export interface BaseConfig {
  enabled: boolean;
  threshold?: number;
  windowSize?: number;
}

// Common types
export type Frequency = number;
export type Amplitude = number;
export type Phase = number;
export type Energy = number;
export type Power = number;
export type SNR = number;

export type ProcessingCallback = (result: ProcessingResult) => void;
export type ValidationCallback = (result: ValidationResult) => void;
export type CalibrationCallback = (state: CalibrationState) => void;

