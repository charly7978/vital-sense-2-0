
// IMPORTANTE: NO MODIFICAR FUNCIONALIDAD
// Este archivo contiene definiciones de tipos base

import { SignalQualityLevel } from './index';

export interface ProcessorEvent {
  type: string;
  data?: any;
  timestamp: number;
}

export interface CircularBuffer<T> {
  push(value: T): void;
  get(index: number): T;
  length: number;
  clear(): void;
}

export interface MotionVector {
  dx: number;
  dy: number;
  magnitude: number;
}

export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SystemConfig {
  processing: {
    mode: 'normal' | 'calibration' | 'debug';
    sampleRate?: number;
    sensitivity: SensitivitySettings;
    calibration: CalibrationState;
  };
  camera: {
    constraints: MediaStreamConstraints;
    settings: {
      width: number;
      height: number;
      frameRate: number;
      facingMode: 'user' | 'environment';
    };
  };
  sensitivity: SensitivitySettings;
  calibration: CalibrationState;
  sampling?: {
    rate: number;
    interval: number;
  };
}

export interface SensitivitySettings {
  brightness: number;
  redIntensity: number;
  signalAmplification: number;
  noiseReduction: number;
  peakDetection: number;
  heartbeatThreshold: number;
  responseTime: number;
  signalStability: number;
  filterStrength?: number;
  adaptiveThreshold?: number;
}

export interface SignalQualityParams {
  signal: number[];
  noise: NoiseAnalysis;
  motion: MotionAnalysis;
  heartRate: number;
  features: any;
}

export interface ColorProfile {
  mean: number[];
  std: number[];
  histogram: number[];
  skinLikelihood: number;
}

export interface DetectionQuality {
  level: SignalQualityLevel;
  coverage: number;
  stability: number;
  contrast: number;
}

export interface MotionEstimate {
  dx: number;
  dy: number;
  confidence: number;
  transform?: any;
}

export type LightConditions = 'low' | 'normal' | 'high' | 'unknown';

export interface DetectionMetrics {
  frameCount: number;
  errorRate: number;
  stability: number;
  coverage: number;
}
