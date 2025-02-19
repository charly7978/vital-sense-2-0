import { SignalQuality } from './quality';
import { Float64Type, MeasurementType } from './common';
import { FrequencyBands, SpectralFeatures } from './analysis';

export interface SignalConditions {
  signalQuality: number;
  lightLevel: number;
  movement: number;
  coverage: number;
  temperature: number;
  stability: number;
  measurementType: MeasurementType;
}

export interface CalibrationEntry {
  raw: number;
  calibrated: number;
  conditions: SignalConditions;
  factor: number;
  timestamp: number;
}

export interface CalibratedResult {
  value: number;
  confidence: number;
  factor: number;
}

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
  optimization: {
    vectorization: boolean;
    parallelization: boolean;
    precision: string;
    cacheSize: number;
    adaptiveWindow: boolean;
  };
}

export interface BeatDetection {
  beats: BeatFeatures[];
  features: any; // Replace with proper type when needed
  quality: BeatQuality;
  metrics: BeatMetrics;
}

export interface BeatFeatures {
  peak: number;
  segment: Float64Type;
  morphology: any; // Replace with proper type when needed
  template: any; // Replace with proper type when needed
  interval: number;
  quality: BeatQuality;
}

export interface BeatQuality {
  overall: number;
  artifacts: number;
  noise: number;
  confidence: number;
}

export interface BeatMetrics {
  rate: number;
  regularity: number;
  variability: number;
}

export interface TemplateMatching {
  score: number;
  template: Float64Type;
  features: any; // Replace with proper type when needed
}

export interface PeakAnalysis {
  locations: number[];
  amplitudes: Float64Type;
  intervals: Float64Type;
  features: any; // Replace with proper type when needed
}

export interface WaveformQuality {
  score: number;
  confidence: number;
  metrics: any; // Replace with proper type when needed
}

export interface QualityMetrics {
  snr: number;
  artifacts: number;
  stability: number;
  overall: number;
  confidence: number;
}

export interface BeatMorphology {
  width: number;
  amplitude: number;
  slope: number;
  area: number;
  symmetry: number;
}

export interface BeatValidation {
  isValid: boolean;
  confidence: number;
  metrics: BeatMetrics;
}
