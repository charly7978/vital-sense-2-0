
import { Float64Array } from '@/types';

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
