
import { Float64Type } from './common';
import { SignalQuality, SignalQualityLevelType } from './quality';

export interface BeatConfig {
  sampleRate: number;
  windowSize: number;
  peakDetection: {
    threshold: number;
    minDistance: number;
    maxGap: number;
  };
  morphology: {
    enabled: boolean;
    features: string[];
  };
  quality: {
    minConfidence: number;
    maxArtifacts: number;
  };
}

export interface BeatDetection {
  peak: number;
  timestamp: number;
  confidence: number;
  quality: BeatQuality;
  features: BeatFeatures;
  metrics: BeatMetrics;
}

export interface BeatFeatures {
  temporal: Float64Type;
  spectral: Float64Type;
  morphology: any;
  quality: number;
}

export interface BeatQuality extends SignalQuality {
  morphology: number;
  timing: number;
  physiological: number;
  level: SignalQualityLevelType; // Fixed type
  artifacts: number;
  noise: number;
}

export interface BeatMetrics {
  rate: number;
  regularity: number;
  variability: number;
  quality: number;
}
