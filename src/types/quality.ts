
import { SignalQualityLevelType, Disposable } from './common';
import { NoiseAnalysis, MotionAnalysis } from './analysis';

export interface SignalQuality extends Disposable {
  level: SignalQualityLevelType;
  score: number;
  confidence: number;
  overall: number;
  history: number[];
  signal?: number;
  noise?: number;
  movement?: number;
  threshold?: number;
}

export interface QualityConfig {
  snrThreshold: number;
  stabilityWindow: number;
  noiseThreshold: number;
  windowSize?: number;
  analysisParams?: {
    fftSize: number;
    overlap: number;
  };
  validation?: {
    minConfidence: number;
    maxArtifacts: number;
    minAmplitude?: number;
    waveformStability?: number;
  };
  wavelet?: {
    decompositionLevel: number;
    waveletType: string;
    type?: string;
    levels?: number;
  };
}

export interface SignalConditions {
  brightness: number;
  contrast: number;
  noise: number;
  stability: number;
  signalQuality: number;
  lightLevel: number;
  movement: number;
  coverage: number;
  temperature: number;
  measurementType?: string;
}

export interface QualityMetrics {
  snr: number;
  stability: number;
  noise: number;
  overall: number;
  frequency?: number;
  amplitude?: number;
  artifacts?: number;
}
