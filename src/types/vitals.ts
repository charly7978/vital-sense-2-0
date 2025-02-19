
// IMPORTANTE: NO MODIFICAR FUNCIONALIDAD
// Este archivo contiene los tipos base del sistema

import { SignalQualityLevel } from './index';

export interface PPGData {
  timestamp: number;
  values: number[];
  quality: number;
  bpm?: number;
}

export interface CircularBuffer<T> {
  push(value: T): void;
  get(index: number): T;
  length: number;
  clear(): void;
}

export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  deviceId?: string;
  facingMode?: 'user' | 'environment';
}

export interface FingerDetection {
  isPresent: boolean;
  roi?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  quality: number;
}

export interface DetectionError {
  message: string;
  timestamp: number;
  code?: string;
  frame?: number;
}

export interface RegionAnalysis {
  roi: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  quality: number;
  coverage: number;
  stability: number;
  contrast: number;
}

export interface ColorProfile {
  mean: number[];
  std: number[];
  histogram: number[];
  skinLikelihood: number;
}

export interface DetectionQuality {
  coverage: number;
  stability: number;
  contrast: number;
}

export interface MotionEstimate {
  dx: number;
  dy: number;
  confidence: number;
}

export interface DetectionMetrics {
  frameCount: number;
  errorRate: number;
  stability: number;
  coverage: number;
}

export interface ProcessorEvent {
  type: string;
  data?: any;
  timestamp: number;
}

// Tipos para componentes del sistema
export interface SystemConfig {
  processing: {
    mode: 'normal' | 'calibration' | 'debug';
    sampleRate?: number;
    sensitivity: SensitivitySettings;
    calibration: CalibrationState;
  };
  camera: {
    constraints: MediaTrackConstraints;
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
