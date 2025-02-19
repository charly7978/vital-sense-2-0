
import { Float64Type, Disposable } from './common';

export interface SpectralAnalysis extends Disposable {
  spectrum: Float64Type;
  frequencies: Float64Type;
  magnitude: Float64Type;
  phase: Float64Type;
}

export interface WaveletAnalysis extends Disposable {
  coefficients: WaveletCoefficients;
  features: SubbandFeatures;
  levels: number;
}

export interface FrequencyBands {
  vlf: [number, number];
  lf: [number, number];
  hf: [number, number];
  total: [number, number];
  ratios?: {
    lfHf: number;
    vlfTotal: number;
  };
}

export interface SpectralFeatures {
  mainFrequency: number;
  harmonics: number[];
  bandwidth: number;
  energy: number[];
}

export interface WaveletCoefficients {
  approximation: Float64Type;
  details: Float64Type[];
}

export interface SubbandFeatures {
  energy: number[];
  entropy: number[];
  variance: number[];
}

export interface NoiseAnalysis extends Disposable {
  snr: number;
  distribution: number[];
  spectrum: number[];
  entropy: number;
  kurtosis: number;
  variance: number;
  spectralNoise?: number;
  threshold?: number;
  waveletNoise?: number;
  impulseNoise?: number;
}

export interface MotionAnalysis extends Disposable {
  displacement: number[];
  velocity: number[];
  acceleration: number[];
  threshold?: number;
  features?: any[];
  detection?: number;
}
