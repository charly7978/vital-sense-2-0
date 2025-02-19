
// IMPORTANTE: NO MODIFICAR FUNCIONALIDAD
// Este archivo solo contiene definiciones de tipos

import { SignalQuality, NoiseAnalysis, MotionAnalysis } from './signal';
import { CalibrationState } from './calibration';
import { SensitivitySettings } from './index';

export interface ProcessingConfig {
  mode: 'normal' | 'calibration' | 'debug';
  sampleRate?: number;
  sensitivity: SensitivitySettings;
  calibration: CalibrationState;
  bufferSize: number;
  filterOrder: number;
  lowCutoff: number;
  highCutoff: number;
  peakThreshold: number;
  minPeakDistance: number;
  calibrationDuration: number;
  adaptiveThreshold: boolean;
}

export interface ProcessingState {
  isProcessing: boolean;
  frameCount: number;
  calibration: CalibrationState;
  buffer: Float64Array;
  timeBuffer: Float64Array;
  lastTimestamp: number;
  sampleRate: number;
  quality: SignalQuality;
  optimization?: {
    cache: boolean;
    performance: boolean;
    memory: boolean;
  };
}

export interface ProcessorMetrics {
  frameRate: number;
  processingTime: number;
  memoryUsage: number;
  quality: SignalQuality;
  errorRate: number;
  signalQuality: number;
  signalToNoise: number;
  movementIndex: number;
  perfusionIndex: number;
  confidence: number;
  stability: number;
  coverage: number;
}

export interface ProcessingPipeline {
  initialize(): void;
  process(data: any): Promise<any>;
  cleanup(): void;
}

export interface QualityParams {
  signal: number[];
  noise: NoiseAnalysis;
  motion: MotionAnalysis;
  heartRate: number;
  features: any;
  fingerDetection?: any;
}

export type ProcessingMode = 'normal' | 'calibration' | 'debug';
