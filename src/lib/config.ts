
import { SensitivitySettings, CalibrationState, ProcessingConfig } from '../types/calibration';
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

export const defaultConfig: ProcessingConfig = {
  mode: 'normal',
  sampleRate: 30,
  bufferSize: 256,
  enabled: true,
  duration: 5000,
  reference: new Float64Array(),
  calibration: defaultCalibrationState,
  filter: {
    enabled: true,
    lowCut: 0.5,
    highCut: 4.0,
    order: 4,
    nfft: 1024
  },
  filterOrder: 4,
  lowCutoff: 0.5,
  highCutoff: 4.0,
  peakThreshold: 0.3,
  minPeakDistance: 0.3,
  calibrationDuration: 5000,
  adaptiveThreshold: true,
  harmonics: {
    enabled: true,
    maxHarmonics: 5,
    minAmplitude: 0.1,
    tracking: true
  }
};
