
import { Float64Type } from './common';
import { SignalQuality } from './quality';

export interface Metadata {
  timestamp: number;
  version: string;
  source: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  details: string[];
  quality?: SignalQuality;
}

export interface ProcessingState {
  isProcessing: boolean;
  frameCount: number;
  buffer: Float64Type;
  timeBuffer: Float64Type;
  lastTimestamp: number;
  sampleRate: number;
  quality: SignalQuality;
  optimization: {
    cache: Map<string, any>;
    performance: Map<string, number>;
    resources: Map<string, any>;
  };
  calibration: {
    isCalibrated: boolean;
    lastCalibration: number;
    referenceValues: Float64Type;
    calibrationQuality: number;
    enabled: boolean;
    duration: number;
    reference: Float64Type;
  };
}

export interface SignalProcessor {
  process(signal: Float64Array): SignalQuality;
  analyze(signal: Float64Array): { [key: string]: any };
  dispose(): void;
  initialize?(): void;
  validateInput?(input: any): boolean;
  prepareProcessing?(input: any): any;
  handleProcessingError?(error: Error): void;
  updateState?(state: any): void;
}

export interface Disposable {
  dispose(): void;
}
