import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { ValidationResult } from './core';
import { SpectralAnalysis, WaveletAnalysis } from './analysis';

// Base analyzer interface
export interface BaseAnalyzer {
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
}

export interface BeatDetection {
  peak: number;
  timestamp: number;
  confidence: number;
  quality: SignalQuality;
  features: BeatFeatures;
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

// Signal processor types
export interface ProcessorOptimization {
  cache: Map<string, any>;
  performance: Map<string, number>;
  resources: Map<string, any>;
}

export interface SignalCalibration {
  reference: Float64Type;
  calibrated: boolean;
  timestamp: number;
  factors: Map<string, number>;
}

export interface ProcessingQuality extends SignalQuality {
  temporal: number;
  spectral: number;
  morphological: number;
}

// Blood pressure types
export interface BPConfig {
  sampleRate: number;
  calibrationDuration: number;
  referenceReadings: number[];
  validation: {
    minQuality: number;
    maxVariability: number;
  };
}

export interface BPEstimation {
  systolic: number;
  diastolic: number;
  mean: number;
  confidence: number;
  quality: SignalQuality;
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

// Motion analysis types
export interface MotionConfig {
  windowSize: number;
  overlap: number;
  threshold: number;
}

export interface CompensationMode {
  type: 'global' | 'local' | 'hybrid';
  params: Record<string, any>;
}

export interface StabilizationMatrix {
  transform: Float64Array;
  quality: number;
}

// Additional analyzer types
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

export interface ProcessorState {
  isProcessing: boolean;
  frameCount: number;
  buffer: Float64Array;
  timeBuffer: Float64Array;
  lastTimestamp: number;
  sampleRate: number;
  calibration: CalibrationState;
  quality: SignalQuality;
  optimization: {
    cache: Map<string, any>;
    performance: Map<string, number>;
    resources: Map<string, any>;
  };
}

export interface AnalyzerBase {
  initialize(): void;
  dispose(): void;
  validateInput(input: Float64Array): boolean;
  handleError(error: Error): void;
  updateState(state: any): void;
}
