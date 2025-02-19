
import { SignalQuality } from './quality';
import { CalibrationState, ProcessingConfig, SensitivitySettings } from './config';
import { MeasurementType, MediaTrackConstraintsExtended } from './common';

export interface VitalReading {
  timestamp: number;
  value: number;
  type: MeasurementType;
  confidence: number;
  quality?: SignalQuality;
}

export interface PPGData {
  timestamp: number;
  values: number[];
  bpm: number;
  confidence: number;
  quality?: SignalQuality;
}

export interface VitalMeasurement {
  reading: VitalReading;
  calibration: CalibrationState;
  timestamp: number;
}

export interface VitalConfig {
  type: MeasurementType;
  sampleRate: number;
  calibrationDuration: number;
  updateInterval: number;
}

export interface ProcessingState {
  isProcessing: boolean;
  frameCount: number;
  buffer: Float64Array;
  timeBuffer: Float64Array;
  lastTimestamp: number;
  sampleRate: number;
  calibration: CalibrationState;
  quality: SignalQuality;
  optimization: {
    cache: Map<string, any>;
    performance: Map<string, number>;
    resources: Map<string, any>;
  };
}

export interface PPGProcessingConfig extends ProcessingConfig {
  filterCoefficients?: Float64Array;
  mode: 'normal' | 'calibration' | 'debug';
  sampleRate: number;
  sensitivity: SensitivitySettings;
  calibration: CalibrationState;
}

export interface ProcessorMetrics {
  fps: number;
  cpuTime: number;
  memoryUsage: number;
  cacheHits: number;
  cacheMisses: number;
  latency: number;
}

export { MediaTrackConstraintsExtended };
