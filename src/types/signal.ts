
import { SignalQuality } from './quality';
import { ProcessingConfig } from './config';
import { Float64Array } from './common';

export interface SignalAnalysis {
  features: SignalFeatures;
  quality: SignalQuality;
  metrics: ProcessorMetrics;
}

export interface SignalFeatures {
  temporal: TemporalFeatures;
  spectral: SpectralFeatures;
  statistical: StatisticalFeatures;
}

export interface ProcessorMetrics {
  snr: number;
  bpm: number;
  quality: SignalQuality;
  timestamp: number;
}

export interface FilterConfig {
  order: number;
  cutoff: number[];
  type: 'lowpass' | 'highpass' | 'bandpass';
  window?: 'hamming' | 'hanning' | 'blackman';
  sampleRate?: number;
  bands?: {
    vlf: [number, number];
    lf: [number, number];
    hf: [number, number];
    total: [number, number];
    cardiac?: [number, number];
    respiratory?: [number, number];
    mains?: [number, number];
  };
  adaptive?: boolean;
  bank?: boolean;
}

export interface TemporalFeatures {
  peaks: number[];
  valleys: number[];
  intervals: number[];
  amplitudes: number[];
}

export interface SpectralFeatures {
  mainFrequency: number;
  harmonics: number[];
  bandwidth: number;
  energy: number[];
}

export interface StatisticalFeatures {
  mean: number;
  variance: number;
  skewness: number;
  kurtosis: number;
}

export interface SignalValidation {
  isValid: boolean;
  confidence: number;
  errors: string[];
}

export interface ProcessingQuality {
  snr: number;
  stability: number;
  artifacts: number;
  overall: number;
}

export type AnalysisMode = 'realtime' | 'offline' | 'batch';

export interface ProcessingPipeline {
  filters: FilterConfig[];
  features: string[];
  validators: string[];
}

export interface ProcessorOptimization {
  cacheSize: number;
  batchSize: number;
  parallel: boolean;
  precision: 'single' | 'double';
}
