
import { ProcessingMode } from './common';
import { FrequencyBands } from './analysis';

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
}

export interface FilterConfig {
  order: number;
  cutoff: number[];
  type: 'lowpass' | 'highpass' | 'bandpass';
  window?: 'hamming' | 'hanning' | 'blackman';
  sampleRate?: number;
  bands?: FrequencyBands;
}

export interface FrequencyConfig {
  sampleRate: number;
  windowSize: number;
  fftSize: number;
  overlap: number;
  method: 'welch' | 'fft';
  spectral: {
    method: string;
    window: string;
    nfft: number;
    detrend: string;
    averaging: string;
  };
  bands: FrequencyBands;
  harmonics: {
    maxOrder: number;
    minAmplitude: number;
    tolerance: number;
    tracking: boolean;
  };
  phase: {
    unwrapping: string;
    smoothing: number;
    coherence: boolean;
    groupDelay: boolean;
  };
  optimization: {
    vectorization: boolean;
    parallelization: boolean;
    precision: 'single' | 'double';
    cacheSize: number;
    adaptiveWindow: boolean;
  };
}
