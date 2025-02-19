
import { SignalQuality } from './quality';

export interface VitalReading {
  value: number;
  timestamp: number;
  confidence: number;
  quality?: SignalQuality;
}

export interface PPGData {
  timestamp: number;
  values: number[];
  bpm: number;
  confidence: number;
}

export interface PPGProcessingConfig {
  mode: 'normal' | 'calibration' | 'debug';
  sampleRate: number;
  bufferSize: number;
  sensitivity: {
    brightness: number;
    redIntensity: number;
    signalAmplification: number;
  };
  filter: {
    enabled: boolean;
    lowCut: number;
    highCut: number;
    order: number;
  };
}

export interface ProcessingState {
  isProcessing: boolean;
  frameCount: number;
  buffer: Float64Array;
  timeBuffer: Float64Array;
  lastTimestamp: number;
  sampleRate: number;
  calibration: {
    isCalibrating: boolean;
    progress: number;
    message: string;
    isCalibrated: boolean;
    calibrationTime: number;
    referenceValues: Float64Array;
    calibrationQuality: number;
  };
  quality: SignalQuality;
  optimization: {
    cache: Map<string, any>;
    performance: Map<string, number>;
    resources: Map<string, any>;
  };
}
