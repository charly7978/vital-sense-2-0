
import { SignalQualityLevel } from './base';

export interface SignalQuality {
  level: SignalQualityLevel;
  score: number;
  confidence: number;
  overall: number;
  history: number[];
  signal?: number;
  noise?: number;
  movement?: number;
  threshold?: number;
  dispose?: () => void;
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
  };
  wavelet?: {
    decompositionLevel: number;
    waveletType: string;
  };
}

export interface QualityMetrics {
  snr: number;
  stability: number;
  noise: number;
  overall: number;
  frequency?: number;
  amplitude?: number;
  artifacts?: number;
  metrics?: any;
}
