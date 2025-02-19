
import { Float64Type } from './common';
import { SignalQuality } from './quality';

export interface ArtifactConfig {
  temporal: boolean;
  spectral: boolean;
  statistical: boolean;
  minQuality: number;
}

export interface ArtifactDetection {
  isArtifact: boolean;
  type: string;
  confidence: number;
  features: ArtifactFeatures;
  quality: SignalQuality;
}

export interface ArtifactFeatures {
  temporal: Float64Type;
  spectral: Float64Type;
  statistical: Float64Type;
}

export interface MotionAnalysis {
  displacement: number;
  velocity: number;
  acceleration: number;
  features: Float64Type;
  quality: number;
}

export interface NoiseAnalysis {
  snr: number;
  distribution: Float64Type;
  spectrum: Float64Type;
  entropy: number;
  kurtosis: number;
  variance: number;
}

