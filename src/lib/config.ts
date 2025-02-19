
import { SensitivitySettings, CalibrationState } from '../types/calibration';
import { ProcessingMode } from '../types/common';

export const defaultSensitivitySettings: SensitivitySettings = {
  brightness: 1.0,
  redIntensity: 1.0,
  signalAmplification: 1.0,
  noiseReduction: 0.5,
  peakDetection: 0.7,
  heartbeatThreshold: 0.3,
  responseTime: 0.2,
  signalStability: 0.8,
  snr: 10
};

export const defaultCalibrationState: CalibrationState = {
  isCalibrating: false,
  progress: 0,
  message: '',
  isCalibrated: false,
  calibrationTime: 0,
  referenceValues: new Float64Array(),
  calibrationQuality: 0,
  enabled: true,
  duration: 5000,
  reference: new Float64Array(),
  lastCalibration: Date.now()
};

export const defaultConfig = {
  mode: 'normal' as ProcessingMode,
  sampleRate: 30,
  bufferSize: 256,
  sensitivity: defaultSensitivitySettings,
  calibration: defaultCalibrationState,
  filter: {
    enabled: true,
    lowCut: 0.5,
    highCut: 4.0,
    order: 4
  }
};

