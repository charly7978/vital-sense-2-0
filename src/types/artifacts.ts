
import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { ValidationResult } from './core';

export interface ArtifactConfig {
  sampleRate: number;
  windowSize: number;  
  overlapSize: number;
  motion: {
    enabled: boolean;
    threshold: number;
    window: number;
    features: string[];
    fusion: string;
  };
  noise: {
    enabled: boolean;
    methods: string[];
    thresholds: Record<string, number>;
  };
  spectral: {
    enabled: boolean;
    method: string;
    window: string;
    segments: number;
    overlap: number;
    bands: number[][];
  };
}

export interface ArtifactDetection {
  isArtifact: boolean;
  confidence: number;
  type: string;
  severity: number;
  quality: SignalQuality;
  features?: ArtifactFeatures;
  segments?: SignalSegmentation;
  metrics?: ArtifactMetrics;
  timestamp?: number;
}

export interface ArtifactFeatures {
  temporal: Float64Type;
  statistical: Float64Type;
  spectral?: Float64Type;
  wavelet?: Float64Type;
  motion?: Float64Type;
  noise?: Float64Type;
  quality: number;
}

export interface MotionAnalysis {
  features: number[];
  threshold: number;
  detection: boolean;
  acceleration?: Float64Type;
  jerk?: Float64Type;
  displacement?: Float64Type;
  energy?: Float64Type;
  dispose(): void;
}

export interface NoiseAnalysis {
  snr: number;
  distribution: Float64Type;
  spectrum: Float64Type;
  entropy: number;
  kurtosis: number;
  variance: number;
  spectralNoise?: number;
  isNoisy?: boolean;
  dispose(): void;
}

export interface SignalSegmentation {
  segments: Float64Type[];
  boundaries: number[];
  quality: number[];
  timestamps?: number[];
  features?: ArtifactFeatures[];
}

export interface ArtifactMetrics {
  noiseLevel: number;
  motionIndex: number;
  signalQuality: number;
  confidence: number;
  temporal?: number;
  spectral?: number;
  wavelet?: number;
  overall?: number;
}

export interface TemplateMatching {
  similarity: number;
  offset: number;
  scale: number;
  quality: number;
  template?: Float64Type;
  correlation?: Float64Type;
  distance?: number;
  dispose(): void;
}

export interface ArtifactValidation extends ValidationResult {
  motion: boolean;
  noise: boolean;
  spectral: boolean;
  wavelet?: boolean;
  template?: boolean;
  physiological?: boolean;
  dispose(): void;
}

export interface ArtifactClassification {
  type: string;
  confidence: number;
  severity: number;
  features?: ArtifactFeatures;
  probability?: number;
  metrics?: ArtifactMetrics;
}
