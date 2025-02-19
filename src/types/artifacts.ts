
import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { Disposable } from './common';

export interface ArtifactConfig {
  temporal: boolean;
  spectral: boolean;
  statistical: boolean;
  minQuality: number;
  windowSize?: number;
  overlapSize?: number;
  validation?: boolean;
  noise?: {
    enabled: boolean;
    methods: string[];
    thresholds: Record<string, number>;
  };
  motion?: {
    enabled: boolean;
    threshold: number;
    window: number;
  };
}

export interface ArtifactClassification {
  type: string;
  confidence: number;
  features: ArtifactFeatures;
}

export interface SignalSegmentation {
  segments: Float64Type[];
  indices: number[];
}

export interface ArtifactMetrics {
  temporal: number;
  spectral: number;
  statistical: number;
  overall: number;
}

export interface ArtifactDetection extends Disposable {
  isArtifact: boolean;
  type: string;
  confidence: number;
  features: ArtifactFeatures;
  quality: SignalQuality;
  metrics?: ArtifactMetrics;
}

export interface ArtifactFeatures {
  temporal: Float64Type;
  spectral: Float64Type;
  statistical: Float64Type;
}

export interface MotionAnalysis extends Disposable {
  displacement: number;
  velocity: number;
  acceleration: number;
  features: Float64Type;
  quality: number;
}

export interface NoiseAnalysis extends Disposable {
  snr: number;
  distribution: Float64Type;
  spectrum: Float64Type;
  entropy: number;
  kurtosis: number;
  variance: number;
}

export interface ArtifactValidation {
  isValid: boolean;
  confidence: number;
  metrics: ArtifactMetrics;
}
