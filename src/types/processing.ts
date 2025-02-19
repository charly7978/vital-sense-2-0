
import { Float64Type } from './common';
import { SignalQuality } from './quality';

export interface ProcessorConfig {
  sampleRate: number;
  bufferSize: number;
  windowSize: number;
  optimization: {
    vectorized: boolean;
    parallel: boolean;
    precision: 'single' | 'double';
  };
}

export interface SignalAnalysis {
  features: SignalFeatures;
  quality: SignalQuality;
  metrics: ProcessingMetrics;
}

export interface ProcessingPipeline {
  stages: string[];
  config: Record<string, any>;
  callbacks: Record<string, Function>;
}

export interface SignalValidation {
  isValid: boolean;
  confidence: number;
  metrics: ValidationMetrics;
}

export interface ProcessingMetrics {
  latency: number;
  throughput: number;
  quality: number;
}

export type AnalysisMode = 'realtime' | 'batch' | 'streaming';

export interface SignalFeatures {
  temporal: Float64Type;
  spectral: Float64Type;
  statistical: Float64Type; 
}

export interface ProcessingQuality {
  signal: number;
  processing: number;
  overall: number;
}

export interface SignalCalibration {
  isCalibrated: boolean;
  referenceValues: Float64Type;
  calibrationTime: number;
}

export interface ProcessorOptimization {
  cacheEnabled: boolean;
  vectorizationEnabled: boolean;
  parallelizationEnabled: boolean;
}

export interface ValidationMetrics {
  accuracy: number;
  precision: number;
  recall: number;
}

