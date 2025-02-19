
import { Float64Type } from './common';

export interface SpectralAnalysis {
  frequencies: Float64Type;
  magnitudes: Float64Type;
  phases: Float64Type;
  power: Float64Type;
}

export interface FrequencyResponse {
  frequency: number[];
  magnitude: number[];
  phase: number[];
}

export interface PowerSpectrum {
  frequencies: Float64Type;
  power: Float64Type;
  peaks: number[];
}

export interface SpectralDensity {
  frequency: Float64Type;
  density: Float64Type;
}

export interface SpectralContent {
  fundamental: number;
  harmonics: number[];
  snr: number;
}
