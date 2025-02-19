
import { ColorSpace, ROI } from './common';

export interface ImageConfig {
  width: number;
  height: number;
  channels: number;
  colorSpace: ColorSpace;
  resolution?: {
    width: number;
    height: number;
  };
  optimization?: {
    cache: boolean;
    parallel: boolean;
    cacheSize: number;
    vectorization: boolean;
  };
}

export interface ColorProfile {
  mean: number[];
  std: number[];
  histogram: number[][];
  skinLikelihood?: number;
  ratios?: number[];
}

export interface ImageQuality {
  sharpness: number;
  brightness: number;
  contrast: number;
  noise: number;
  exposure?: number;
  overall?: number;
}

export interface ImageMetrics {
  quality: ImageQuality;
  profile: ColorProfile;
  roi: ROI;
}

export interface ProcessingResult {
  image: ImageData;
  metrics: ImageMetrics;
  timestamp: number;
}

export interface AdaptiveFilter {
  type: 'mean' | 'gaussian';
  kernelSize: number;
  sigma?: number;
}

export interface NoiseReduction {
  method: 'gaussian' | 'median';
  kernelSize: number;
  sigma?: number;
}

export interface EdgeDetection {
  method: 'sobel' | 'canny';
  threshold: number;
  sigma?: number;
}
