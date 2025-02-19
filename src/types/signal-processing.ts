
import { Float64Type, Disposable } from './common';
import { SignalQuality } from './quality';
import { FrequencyBands } from './analysis';

export interface SignalConditions extends Disposable {
  isValid: boolean;
  quality: SignalQuality;
  noise: number;
  artifacts: number;
  features: SignalFeatures;
}

export interface SignalFeatures {
  temporal: TemporalFeatures;
  spectral: SpectralFeatures;
  statistical: StatisticalFeatures;
}

export interface TemporalFeatures {
  mean: number;
  variance: number;
  skewness: number;
  kurtosis: number;
  peaks: number[];
  valleys: number[];
}

export interface StatisticalFeatures {
  entropy: number;
  complexity: number;
  stationarity: number;
  linearity: number;
}

export interface ArtifactConfig {
  threshold: number;
  windowSize: number;
  minQuality: number;
  features: string[];
  validation: {
    temporal: boolean;
    spectral: boolean;
    statistical: boolean;
  };
}

export interface ArtifactDetection {
  isArtifact: boolean;
  confidence: number;
  type: string;
  features: ArtifactFeatures;
  metrics: ArtifactMetrics;
}

export interface ArtifactFeatures {
  temporal: TemporalFeatures;
  spectral: SpectralFeatures;
  statistical: StatisticalFeatures;
}

export interface ArtifactMetrics {
  quality: number;
  severity: number;
  duration: number;
  frequency: number;
}

export interface ArtifactClassification {
  type: string;
  confidence: number;
  features: ArtifactFeatures;
}

export interface SignalSegmentation {
  segments: Float64Type[];
  boundaries: number[];
  features: SignalFeatures[];
}

export interface TemplateMatching {
  templates: Float64Type[];
  scores: number[];
  bestMatch: number;
  features: SignalFeatures;
}

export interface ArtifactValidation {
  isValid: boolean;
  confidence: number;
  metrics: ArtifactMetrics;
}

export interface BPConfig {
  sampleRate: number;
  windowSize: number;
  calibrationDuration: number;
  features: string[];
  validation: {
    temporal: boolean;
    waveform: boolean;
    statistical: boolean;
  };
}

export interface BPEstimation {
  systolic: number;
  diastolic: number;
  mean: number;
  confidence: number;
  quality: SignalQuality;
}

// Add more interfaces as needed for BloodPressureEstimator
export interface WaveformAnalysis {
  features: WaveformFeatures;
  quality: WaveformQuality;
}

export interface WaveformFeatures {
  amplitude: number;
  duration: number;
  area: number;
  slope: number;
}

export interface WaveformQuality {
  score: number;
  confidence: number;
  metrics: QualityMetrics;
}

export interface QualityMetrics {
  snr: number;
  stability: number;
  artifacts: number;
}
