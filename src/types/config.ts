
import { ProcessingMode } from './common';
import { FrequencyBands } from './analysis';
import { Float64Type } from './common';
import { CalibrationState } from './calibration';

export interface ProcessingConfig {
  mode: ProcessingMode;
  sampleRate?: number;
  sensitivity: SensitivitySettings;
  calibration: CalibrationState;
  bufferSize: number;
  filterOrder: number;
  lowCutoff: number;
  highCutoff: number;
  peakThreshold: number;
  minPeakDistance: number;
  calibrationDuration: number;
  adaptiveThreshold: boolean;
  validation?: {
    minQuality: number;
    maxArtifacts: number;
  };
  spectral?: {
    method: string;
    window: string;
    nfft: number;
    segments: number;
    overlap: number;
    averaging: string;
  };
  wavelet?: {
    type: string;
    level: number;
    threshold: number;
  };
}

export interface SensitivitySettings {
  brightness: number;
  redIntensity: number;
  signalAmplification: number;
  noiseReduction: number;
  peakDetection: number;
  heartbeatThreshold: number;
  responseTime: number;
  signalStability: number;
  snr?: number;
}
