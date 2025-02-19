
import { Float64Type } from './common';
import { Disposable } from './common';

export interface FrequencyBands {
  vlf: [number, number];
  lf: [number, number];
  hf: [number, number];
  total: [number, number];
  cardiac: [number, number];
  noise?: [number, number];
  ratios?: { [key: string]: number };
  normalized?: { [key: string]: number };
  relative?: { [key: string]: number };
}

export interface SpectralAnalysis extends Disposable {
  frequencies: Float64Type;
  magnitudes: Float64Type;
  phases: Float64Type;
  bands: FrequencyBands;
  harmonics: {
    fundamentals: Float64Type;
    ratios: Float64Type;
    powers: Float64Type;
  };
  spectrum?: {
    power: Float64Type;
    frequency: Float64Type;
  };
}

export interface HarmonicAnalysis extends Disposable {
  fundamentals: Float64Type;
  harmonics: Float64Type[];
  amplitudes: Float64Type;
  phases: Float64Type;
  quality: number;
  ratios: Float64Type;
  powers: Float64Type;
  maxOrder?: number;
}

export interface PhaseAnalysis extends Disposable {
  unwrapped: Float64Type;
  group: Float64Type;
  coherence: number;
  stability: number;
  phase?: Float64Type;
  groupDelay?: boolean;
}

export interface WaveletAnalysis extends Disposable {
  analyze(signal: Float64Type): WaveletTransform;
  reconstruct(coeffs: WaveletCoefficients): Float64Type;
  coefficients: Float64Type[];
  features?: Float64Type[];
}

export interface WaveletTransform {
  transform: Float64Type[];
  inverse: (coeffs: Float64Type[]) => Float64Type;
  coefficients: Float64Type[];
}

export interface WaveletCoefficients {
  approximation: Float64Type;
  details: Float64Type[];
  level: number;
}

export interface FrequencyConfig {
  windowSize: number;
  overlapSize: number;
  samplingRate: number;
  method: 'fft' | 'welch' | 'periodogram';
  window: string;
  segments: number;
  overlap: number;
  nfft?: number;
  averaging?: string;
  bands: FrequencyBands;
  harmonics: {
    enabled: boolean;
    maxHarmonics: number;
    minAmplitude: number;
    maxOrder?: number;
    tracking?: boolean;
  };
  spectral: {
    method: string;
    window: string;
    segments: number;
    overlap: number;
  };
  phase: {
    unwrapping: string;
    smoothing: number;
    coherence: boolean;
    groupDelay?: boolean;
  };
}

export interface SpectralFeatures {
  frequencies: Float64Type;
  magnitudes: Float64Type;
  phases: Float64Type;
  power: Float64Type;
}

export interface SpectralQuality {
  snr: number;
  coherence: number;
  stationarity: number;
  harmonicity: number;
  overall: number;
}

export interface BandPower {
  total: number;
  bands: { [key: string]: number };
  ratios: { [key: string]: number };
  normalized: { [key: string]: number };
  relative: { [key: string]: number };
}

export interface FrequencyMetrics {
  snr: number;
  bandwidth: number;
  centralFreq: number;
  harmonicRatio: number;
}
