
import { Float64Type } from './common';

export interface FrequencyResponse {
  magnitude: Float64Type;
  phase: Float64Type;
  frequency: Float64Type;
}

export interface PowerSpectrum {
  power: Float64Type;
  frequency: Float64Type;
}

export interface SpectralDensity {
  density: Float64Type;
  frequency: Float64Type;
}

export interface HarmonicAnalysis {
  fundamentals: Float64Type;
  harmonics: Float64Type[];
  ratios: Float64Type;
}

export interface PhaseAnalysis {
  unwrapped: Float64Type;
  group_delay: Float64Type;
  coherence: Float64Type;
}

export interface FrequencyMetrics {
  centroid: number;
  bandwidth: number;
  flatness: number;
  roll_off: number;
}

export interface SpectralQuality {
  snr: number;
  harmonic_ratio: number;
  clarity: number;
  overall: number;
}

export interface BandPower {
  values: Record<string, number>;
  ratios: Record<string, number>;
  total: number;
}

export interface ComplexArray {
  real: Float64Array;
  imag: Float64Array;
  length: number;
}

