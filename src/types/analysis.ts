
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
  respiratory?: [number, number];
  cardiac?: [number, number];
  mains?: [number, number];
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
  baselineNoise?: number;
}

export interface MotionAnalysis extends Disposable {
  displacement: number[];
  velocity: number[];
  acceleration: number[];
  threshold?: number;
  features?: any[];
  detection?: number;
}

export interface CalibrationEntry {
  timestamp: number;
  raw: number;
  calibrated: number;
  conditions: any;
  factor: number;
}

export interface CalibratedResult {
  value: number;
  confidence: number;
  factor: number;
}

export interface WaveletTransform {
  coefficients: WaveletCoefficients;
  bases: WaveletBasis[];
  packets: WaveletPacket[];
  space: ScaleSpace;
}

export interface WaveletBasis {
  scale: number;
  translation: number;
  coefficients: Float64Type;
}

export interface WaveletPacket {
  level: number;
  index: number;
  coefficients: Float64Type;
}

export interface ScaleSpace {
  scales: number[];
  coefficients: Float64Type[][];
}

export interface OptimizedDWT {
  forward: (signal: Float64Type) => WaveletTransform;
  inverse: (transform: WaveletTransform) => Float64Type;
}
