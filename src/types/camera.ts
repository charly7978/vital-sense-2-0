
export interface CameraConfig extends MediaTrackConstraints {
  width: { ideal: number };
  height: { ideal: number };
  facingMode: 'user' | 'environment';
  frameRate: { ideal: number };
  advanced?: MediaTrackConstraintSet[];
}

export interface ImageEnhancement {
  brightness: number;
  contrast: number;
  saturation: number;
  sharpness: number;
}

export interface ColorAnalysis {
  channels: number[][];
  histogram: number[][];
  statistics: {
    mean: number[];
    std: number[];
    entropy: number[];
  };
}

export interface EdgeDetection {
  method: 'sobel' | 'canny';
  threshold: number;
  sigma?: number;
}

export interface NoiseReduction {
  method: 'gaussian' | 'median';
  kernelSize: number;
  sigma?: number;
}

export interface AdaptiveFilter {
  type: 'mean' | 'gaussian';
  blockSize: number;
  constant: number;
}

export interface ImageMetrics {
  sharpness: number;
  brightness: number;
  contrast: number;
  noise: number;
  quality: number;
}

export type ProcessingMode = 'preview' | 'capture' | 'analysis';
