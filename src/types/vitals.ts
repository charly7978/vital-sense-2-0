
import { Float64Type, ProcessingMode, MeasurementType } from './common';
import { SignalQuality } from './quality';
import { CalibrationState } from './calibration';
import { SensitivitySettings } from './config';

export interface VitalReading {
  value: number;
  timestamp: number;
  confidence: number;
  quality: SignalQuality;
}

export interface PPGData {
  timestamp: number;
  values: number[];
  bpm?: number;
  confidence?: number;
}

export interface PPGProcessingConfig {
  mode: ProcessingMode;
  sampleRate: number;
  bufferSize: number;
  sensitivity: SensitivitySettings;
  filter: {
    enabled: boolean;
    lowCut: number;
    highCut: number;
    order: number;
    nfft?: number;
  };
  filterOrder?: number;
  lowCutoff?: number;
  highCutoff?: number;
  peakThreshold?: number;
  minPeakDistance?: number;
  calibrationDuration?: number;
  adaptiveThreshold?: boolean;
  calibration: CalibrationState;
}

export interface SignalConditions {
  temperature: number;
  lightLevel: number;
  movement: number;
  stability: number;
  coverage: number;
  signalQuality: number;
  measurementType: MeasurementType;
}

export interface VitalSigns {
  heartRate: VitalReading;
  SpO2: VitalReading;
  respirationRate: VitalReading;
  bloodPressure: BloodPressure;
}

export interface BloodPressure {
  systolic: VitalReading;
  diastolic: VitalReading;
  MAP: VitalReading;
  pulsePressure: VitalReading;
}

export enum ArrhythmiaType {
  Normal,
  Bradycardia,
  Tachycardia,
  Irregular
}
