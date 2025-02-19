
import { Float64Type, Disposable } from './common';

export interface SpectralAnalysis extends Disposable {
  spectrum: Float64Type;
  frequencies: Float64Type;
  magnitude: Float64Type;
  phase: Float64Type;
  bands?: FrequencyBands;
}

export interface WaveletAnalysis extends Disposable {
  coefficients: WaveletCoefficients;
  features: SubbandFeatures;
  levels: number;
  bases: WaveletBasis[];
  space: ScaleSpace;
}

export interface FrequencyBands {
  vlf: [number, number];
  lf: [number, number];
  hf: [number, number];
  total: [number, number];
  respiratory?: [number, number];
  cardiac?: [number, number];
  mains?: [number, number];
  noise?: [number, number];
  ratios?: {
    lfHf: number;
    vlfTotal: number;
  };
  normalized?: {
    vlf: number;
    lf: number;
    hf: number;
  };
  relative?: {
    vlf: number;
    lf: number;
    hf: number;
  };
}

export interface SpectralFeatures {
  mainFrequency: number;
  harmonics: number[];
  bandwidth: number;
  energy: Float64Type;
}

export interface WaveletCoefficients {
  approximation: Float64Type;
  details: Float64Type[];
}

export interface SubbandFeatures {
  energy: Float64Type;
  entropy: Float64Type;
  variance: Float64Type;
}

export interface NoiseAnalysis extends Disposable {
  snr: number;
  distribution: Float64Type;
  spectrum: Float64Type;
  entropy: number;
  kurtosis: number;
  variance: number;
  overall?: number;
  spectralNoise?: number;
  threshold?: number;
  waveletNoise?: number;
  impulseNoise?: number;
  baselineNoise?: number;
}

export interface MotionAnalysis extends Disposable {
  displacement: Float64Type;
  velocity: Float64Type;
  acceleration: Float64Type;
  features?: Float64Type[];
  detection?: number;
  threshold?: number;
}

export interface WaveletTransform {
  coefficients: WaveletCoefficients;
  bases: WaveletBasis[];
  space: ScaleSpace;
}

export interface WaveletBasis {
  scale: number;
  translation: number;
  coefficients: Float64Type;
  filters?: Float64Type[];
}

export interface WaveletPacket {
  level: number;
  index: number;
  coefficients: Float64Type;
  tree?: any;
  initialize: () => void;
  decomposeAll: () => void;
  selectBestBasis: () => void;
  dispose?: () => void;
}

export interface ScaleSpace {
  scales: Float64Type;
  coefficients: Float64Type[][];
  energies?: Float64Type;
}

export interface OptimizedDWT {
  forward: (signal: Float64Type) => WaveletTransform;
  inverse: (transform: WaveletTransform) => Float64Type;
  dispose?: () => void;
}
