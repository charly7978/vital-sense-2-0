
import { SignalQuality } from './quality';
import { Float64Type } from './common';

export interface ProcessorConfig {
  mode: 'normal' | 'calibration' | 'debug';
  sampleRate: number;
  precision: 'single' | 'double';
  optimization: {
    vectorization: boolean;
    parallelization: boolean;
    cacheSize: number;
    adaptiveWindow: boolean;
  };
  filter: {
    enabled: boolean;
    lowCut: number;
    highCut: number;
    order: number;
  };
  validation: {
    minQuality: number;
    maxArtifacts: number;
  };
}

export interface SignalAnalysis {
  features: SignalFeatures;
  quality: SignalQuality;
  metrics: ProcessingMetrics;
}

export interface ProcessingPipeline {
  input: Float64Type;
  filtered: Float64Type;
  quality: SignalQuality;
  features: SignalFeatures;
  metrics: ProcessingMetrics;
}

export interface SignalFeatures {
  temporal: Float64Type;
  spectral: Float64Type;
  statistical: Float64Type;
}

export interface ProcessingQuality extends SignalQuality {
  snr: number;
  stability: number;
  complexity: number;
}

export interface ProcessorOptimization {
  cacheHits: number;
  cacheMisses: number;
  processingTime: number;
  memoryUsage: number;
}

export interface ProcessingMetrics {
  duration: number;
  quality: number;
  confidence: number;
  optimization: ProcessorOptimization;
}

export interface SignalValidation {
  isValid: boolean;
  quality: SignalQuality;
  confidence: number;
  errors?: string[];
}

export type AnalysisMode = 'real-time' | 'batch' | 'streaming';
