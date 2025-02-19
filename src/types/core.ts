
import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { NoiseAnalysis, MotionAnalysis } from './artifacts';

export interface Metadata {
  timestamp: number;
  version: string;
  source: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  details: string[];
}

export interface SignalProcessor extends Disposable {
  process(signal: Float64Type): SignalQuality;
  analyze(signal: Float64Type): {
    noise: NoiseAnalysis;
    motion: MotionAnalysis;
  };
}

export interface Disposable {
  dispose(): void;
}
