
import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { Disposable } from './common';

export interface IntervalAnalysis extends Disposable {
  intervals: Float64Type;
  mean: number;
  std: number;
  variability: number;
}

export interface SpectralAnalysis extends Disposable {
  frequencies: Float64Type;
  amplitudes: Float64Type;
  phases: Float64Type;
  power: Float64Type;
  spectrum: Float64Type;
}

export interface FrequencyAnalysis extends SpectralAnalysis {
  fundamental: number;
  harmonics: number[];
  bandwidth: number;
}

export interface PhaseAnalysis extends Disposable {
  unwrapped: Float64Type;
  instantaneous: Float64Type;
  group: Float64Type;
  coherence: number;
}

export interface FrequencyBands {
  vlf: [number, number];
  lf: [number, number];
  hf: [number, number];
  total: [number, number];
  cardiac: [number, number];
}

export type ComplexArray = {
  real: Float64Array;
  imag: Float64Array;
}

export interface WaveformQuality extends SignalQuality {
  overall: number;
  morphology: number;
  frequency: number;
  stability: number;
}

// Re-export wavelet types to avoid ambiguity
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

