
import { SignalQuality } from './quality';
import { CalibrationState } from './config';
import { MeasurementType } from './common';

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
