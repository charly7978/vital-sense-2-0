
import { SignalQuality, SensitivitySettings } from './index';

export interface ImageConfig {
  width: number;
  height: number;
  channels: number;
  colorSpace: 'rgb' | 'hsv' | 'lab';
}

export interface ProcessingResult {
  success: boolean;
  data?: ImageData;
  error?: Error;
}

export interface ColorSpace {
  name: string;
  channels: number;
  ranges: number[][];
}

export interface ROIDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
}

export interface ImageEnhancement {
  brightness: number;
  contrast: number;
  sharpness: number;
  denoise: number;
}

export interface ColorAnalysis {
  mean: number[];
  std: number[];
  histogram: number[][];
}

export interface NoiseReduction {
  method: 'gaussian' | 'median' | 'bilateral';
  params: Record<string, number>;
}

export interface EdgeDetection {
  method: 'sobel' | 'canny';
  threshold: number;
  sigma?: number;
}

export interface ImageQuality {
  sharpness: number;
  noise: number;
  exposure: number;
  contrast: number;
}

export interface AdaptiveFilter {
  type: 'lms' | 'rls' | 'kalman';
  params: Record<string, number>;
}

export interface ImageMetrics {
  quality: ImageQuality;
  processing: {
    time: number;
    memory: number;
  };
}

export interface ProcessingMode {
  name: string;
  params: Record<string, any>;
}

