
import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { SpectralAnalysis, PhaseAnalysis } from './analysis';
import { Disposable } from './common';

export interface ArtifactConfig {
  temporal: {
    enabled: boolean;
    threshold: number;
    window: number;
    features: string[];
  };
  spectral: {
    enabled: boolean;
    method: string;
    window: string;
    segments: number;
    overlap: number;
    bands: number[][];
  };
  statistical: {
    enabled: boolean;
    metrics: string[];
    threshold: number;
  };
  noise: {
    enabled: boolean;
    methods: string[];
    thresholds: Record<string, number>;
  };
  motion: {
    enabled: boolean;
    threshold: number;
    window: number;
  };
  minQuality: number;
  windowSize: number;
  overlapSize: number;
  validation: {
    minQuality: number;
    maxArtifacts: number;
    consistency: number;
    physiological: boolean;
  };
}

export interface NoiseAnalysis extends Disposable {
  snr: number;
  distribution: Float64Type;
  spectrum: Float64Type; 
  entropy: number;
  kurtosis: number;
  variance: number;
  spectralNoise?: number;
}

export interface MotionAnalysis extends Disposable {
  displacement: number;
  velocity: number;
  acceleration: number;
  features: Float64Type;
  quality: number;
  detection?: {
    isMotion: boolean;
    confidence: number;
  };
}

export interface ArtifactFeatures {
  temporal: Float64Type;
  spectral: Float64Type;
  statistical: Float64Type;
}

export interface ArtifactDetection extends Disposable {
  isArtifact: boolean;
  confidence: number;
  features: ArtifactFeatures;
  quality: SignalQuality;
  type: string;
}

export interface SignalSegmentation {
  segments: Float64Type[];
  timestamps: number[];
  quality: number[];
}

export interface ArtifactMetrics {
  noise: NoiseAnalysis;
  motion: MotionAnalysis;
  spectral: SpectralAnalysis;
  phase: PhaseAnalysis;
}

export interface TemplateMatching extends Disposable {
  match(signal: Float64Type): number;
  update(template: Float64Type): void;
  getDistance(): number;
}

export interface ArtifactValidation extends Disposable {
  validate(detection: ArtifactDetection): boolean;
  getConfidence(): number;
}

export interface ArtifactClassification {
  type: string;
  confidence: number;
  features: ArtifactFeatures;
}
