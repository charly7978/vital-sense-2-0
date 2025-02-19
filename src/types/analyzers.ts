
import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { ValidationResult } from './core';
import { SpectralAnalysis, WaveletAnalysis } from './analysis';

// Base analyzer interface
export interface AnalyzerBase {
  initialize(): void;
  dispose(): void;
  validateInput(input: Float64Type): boolean;
  handleError(error: Error): void;
  updateState(state: any): void;
}

// Beat detection types
export interface BeatConfig {
  sampleRate: number;
  windowSize: number;
  peak: {
    method: string;
    enhancement: {
      enabled: boolean;
      window: number;
      order: number;
    };
    threshold: {
      initial: number;
      adaptation: number;
      minValue: number;
      maxValue: number;
    };
  };
  beat: {
    minInterval: number;
    maxInterval: number;
    template: {
      size: number;
      count: number;
      update: string;
    };
    morphology: {
      features: string[];
      normalization: boolean;
    };
  };
  validation: {
    minQuality: number;
    maxVariability: number;
    physiological: {
      minRate: number;
      maxRate: number;
      maxChange: number;
    };
  };
  optimization?: {
    vectorization: boolean;
    parallelization: boolean;
    precision: 'single' | 'double';
    cacheSize: number;
    adaptiveWindow: boolean;
  };
}

export interface BeatState {
  lastBeat: BeatDetection | null;
  beatHistory: BeatDetection[];
  templateHistory: Float64Array[];
  qualityHistory: number[];
  threshold: {
    value: number;
    history: number[];
    adaptation: number;
  };
}

export interface BeatDetection {
  peak: number;
  timestamp: number;
  confidence: number;
  quality: SignalQuality;
  features: BeatFeatures;
  beats?: BeatFeatures[];
  metrics?: BeatMetrics;
  validation?: BeatValidation;
}

export interface BeatFeatures {
  temporal: Float64Type;
  spectral: Float64Type;
  morphology: BeatMorphology;
  quality: number;
}

export interface BeatMorphology {
  width: number;
  amplitude: number;
  slope: number;
  area: number;
  symmetry: number;
}

export interface BeatQuality extends SignalQuality {
  morphology: number;
  timing: number;
  physiological: number;
  artifacts?: number;
}

export interface BeatValidation extends ValidationResult {
  morphology: boolean;
  timing: boolean;
  physiological: boolean;
}

export interface BeatMetrics {
  rate: number;
  variability: number;
  regularity: number;
  quality: number;
}

export interface IntervalAnalysis {
  mean: number;
  std: number;
  rmssd: number;
  pnn50: number;
}

export interface BeatClassification {
  type: string;
  confidence: number;
  features: BeatFeatures;
}

export interface BeatSegmentation {
  start: number;
  peak: number;
  end: number;
  data: Float64Type;
}

export interface AdaptiveThreshold {
  value: number;
  history: number[];
  adaptation: number;
}

export interface PeakEnhancement {
  window: number;
  order: number;
  coefficients: Float64Type;
}

// Frequency analysis types
export interface FrequencyResponse {
  magnitude: Float64Type;
  phase: Float64Type;
  frequency: Float64Type;
}

export interface PowerSpectrum {
  power: Float64Type;
  frequency: Float64Type;
  resolution: number;
}

export interface SpectralDensity {
  psd: Float64Type;
  frequency: Float64Type;
  bandwidth: number;
}

export interface FrequencyConfig {
  method: string;
  window: string;
  segments: number;
  overlap: number;
  nfft?: number;
  averaging?: string;
}

export interface FrequencyBands {
  vlf: [number, number];
  lf: [number, number];
  hf: [number, number];
  total: [number, number];
  cardiac: [number, number];
}

// Motion analysis types
export interface MotionConfig {
  windowSize: number;
  overlap: number;
  threshold: number;
  blockSize?: number;
  maxFeatures?: number;
  minDistance?: number;
  tracking?: {
    method: string;
    maxIterations: number;
    epsilon: number;
  };
  stabilization?: {
    mode: string;
    smoothing: number;
  };
}

export interface CompensationMode {
  type: 'global' | 'local' | 'hybrid';
  params: Record<string, any>;
}

export interface StabilizationMatrix {
  transform: Float64Array;
  quality: number;
}

// Wavelet analysis types
export interface WaveletBasis {
  name: string;
  coefficients: Float64Type;
  support: [number, number];
}

export interface WaveletPacket {
  coefficients: Float64Type;
  level: number;
  position: number;
}

export interface ScaleSpace {
  coefficients: Float64Type[];
  scales: number[];
}

export interface SubbandFeatures {
  energy: Float64Type;
  entropy: Float64Type;
  kurtosis: Float64Type;
}

export interface OptimizedDWT {
  filters: {
    low: Float64Type;
    high: Float64Type;
  };
  mode: 'periodic' | 'symmetric';
  forward?: (signal: Float64Type) => WaveletCoefficients;
}

export interface WaveletCoefficients {
  approximation: Float64Type;
  details: Float64Type[];
  level: number;
}

