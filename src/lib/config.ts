
import { SensitivitySettings, CalibrationState } from '@/types';

const defaultSensitivity: SensitivitySettings = {
  brightness: 1.0,
  redIntensity: 1.0,
  signalAmplification: 1.0,
  noiseReduction: 1.0,
  peakDetection: 1.0,
  heartbeatThreshold: 1.0,
  responseTime: 1.0,
  signalStability: 1.0
};

const defaultCalibration: CalibrationState = {
  isCalibrating: false,
  progress: 0,
  message: '',
  isCalibrated: false,
  calibrationTime: 0
};

export const config = {
  processing: {
    mode: 'normal' as const,
    sampleRate: 30,
    sensitivity: defaultSensitivity,
    calibration: defaultCalibration,
  },
  camera: {
    constraints: {
      video: {
        facingMode: 'user',
        width: { ideal: 640 },
        height: { ideal: 480 }
      }
    },
    settings: {
      width: 640,
      height: 480,
      frameRate: 30,
      facingMode: 'user' as const
    }
  },
  sensitivity: defaultSensitivity,
  calibration: defaultCalibration
};
