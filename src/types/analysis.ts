
import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { Disposable } from './common';

export interface SpectralFeatures {
  frequencies: Float64Type;
  magnitudes: Float64Type;
  phases: Float64Type;
  power: Float64Type;
}

export interface FrequencyResponse {
  magnitude: Float64Type;
  phase: Float64Type;
  frequencies: Float64Type;
}

export interface PowerSpectrum {
  power: Float64Type;
  frequencies: Float64Type;
}

export interface SpectralDensity {
  density: Float64Type;
  frequencies: Float64Type;
}

export interface HarmonicAnalysis {
  fundamental: number;
  harmonics: Float64Type[];
  ratios: Float64Type;
  phases: Float64Type;
}

export interface FrequencyMetrics {
  snr: number;
  bandwidth: number;
  centralFreq: number;
  harmonicRatio: number;
}

export interface SpectralQuality extends SignalQuality {
  coherence: number;
  stationarity: number;
  harmonicity: number;
}

export interface BandPower {
  total: number;
  bands: { [key: string]: number };
  ratios: { [key: string]: number };
}

// Re-export for convenience while maintaining proper isolation
export type {
  WaveletCoefficients,
  WaveletTransform,
  WaveletBasis,
  WaveletPacket,
  ScaleSpace,
  SubbandFeatures,
  OptimizedDWT,
  WaveletAnalysis
} from './wavelet';
