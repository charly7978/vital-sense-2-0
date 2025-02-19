
import { Float64Type } from './common';

export interface FrequencyBands {
  vlf: [number, number];
  lf: [number, number];
  hf: [number, number];
  total: [number, number];
  cardiac: [number, number];
}

export interface SpectralAnalysis {
  frequencies: Float64Type;
  magnitudes: Float64Type;
  phases: Float64Type;
  bands: FrequencyBands;
  harmonics: {
    fundamentals: Float64Type;
    ratios: Float64Type;
    powers: Float64Type;
  };
}

export interface FrequencyConfig {
  windowSize: number;
  overlapSize: number;
  samplingRate: number;
  method: 'fft' | 'welch' | 'periodogram';
  bands: FrequencyBands;
  harmonics: {
    enabled: boolean;
    maxHarmonics: number;
    minAmplitude: number;
  };
}

export interface PhaseAnalysis {
  unwrapped: Float64Type;
  group: Float64Type;
  coherence: number;
  stability: number;
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
}

export interface BandPower {
  total: number;
  bands: { [key: string]: number };
  ratios: { [key: string]: number };
}

export interface FrequencyMetrics {
  snr: number;
  bandwidth: number;
  centralFreq: number;
  harmonicRatio: number;
}
