
export * from './base';
export * from './quality';
export * from './processing';

// Additional interfaces specific to media handling
export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width?: { ideal: number };
  height?: { ideal: number };
  facingMode?: 'user' | 'environment';
  frameRate?: { ideal: number };
  advanced?: MediaTrackConstraintSet[];
}

// Image processing interfaces
export interface ImageConfig {
  width: number;
  height: number;
  channels: number;
  colorSpace: 'rgb' | 'yuv' | 'hsv';
  resolution?: {
    width: number;
    height: number;
  };
  optimization?: {
    cache: boolean;
    parallel: boolean;
  };
}

export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ColorProfile {
  mean: number[];
  std: number[];
  histogram: number[][];
  ratios?: number[];
}

export interface ImageQuality {
  sharpness: number;
  brightness: number;
  contrast: number;
  noise: number;
  exposure?: number;
}

// Motion Analysis Types
export interface MotionConfig {
  blockSize: number;
  searchRange: number;
  threshold: number;
  minFeatures?: number;
  maxFeatures?: number;
  minDistance?: number;
  tracking?: {
    method: string;
    params: any;
  };
  stabilization?: {
    enabled: boolean;
    smoothing: number;
  };
}

export interface MotionVector {
  x: number;
  y: number;
  magnitude: number;
  angle: number;
  dx?: number;
  dy?: number;
  transform?: any;
  confidence?: number;
}

export interface MotionMetrics {
  displacement: number;
  velocity: number;
  acceleration: number;
}
