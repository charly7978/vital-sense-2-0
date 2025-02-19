import { Float64Type } from './common';

export interface SpectralAnalysis {
  frequencies: Float64Type;
  magnitudes: Float64Type;
  phases: Float64Type;
  features: SpectralFeatures;
  quality: number;
}

export interface WaveletAnalysis {
  coefficients: Float64Type[][];
  scales: Float64Type;
  features: any;
  quality: number;
  analyze: (signal: Float64Type) => void;
}

export interface FrequencyBands {
  vlf: [number, number];
  lf: [number, number];
  hf: [number, number];
  total: [number, number];
}

export interface SpectralFeatures {
  meanFrequency: number;
  peakFrequency: number;
  bandwidth: number;
  spectralCentroid: number;
  spectralSpread: number;
  spectralKurtosis: number;
  spectralSkewness: number;
  spectralRolloff: number;
}

export interface WaveletCoefficients {
  detailCoefficients: Float64Type[];
  approximationCoefficients: Float64Type;
}

export interface SubbandFeatures {
  energy: number;
  entropy: number;
  mean: number;
  variance: number;
}

export interface NoiseAnalysis {
  snr: number;
  distribution: Float64Type;
  spectrum: Float64Type;
  entropy: number;
  kurtosis: number;
  variance: number;
}

export interface MotionAnalysis {
  velocity: number;
  acceleration: number;
  displacement: number;
}

export interface WaveletTransform {
  transform: (signal: Float64Type) => WaveletCoefficients;
  inverseTransform: (coefficients: WaveletCoefficients) => Float64Type;
}

export interface WaveletBasis {
  name: string;
  description: string;
   MotherWavelet: (t: number) => number;
}

export interface WaveletPacket {
  decompose: (signal: Float64Type, level: number) => WaveletCoefficients[];
  reconstruct: (coefficients: WaveletCoefficients[]) => Float64Type;
}

export interface ScaleSpace {
  generate: (signal: Float64Type, scales: number) => Float64Type[];
  analyze: (scaleSpace: Float64Type[]) => any;
}

export interface OptimizedDWT {
  transform: (signal: Float64Type) => WaveletCoefficients;
  inverseTransform: (coefficients: WaveletCoefficients) => Float64Type;
}
