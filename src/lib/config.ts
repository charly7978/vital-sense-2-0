
import { SystemConfig, SensitivitySettings, CalibrationState } from '@/types';

// Configuración del sistema
export const config: SystemConfig = {
  processing: {
    mode: 'normal',
    sensitivity: defaultSensitivity,
    calibration: defaultCalibration
  },
  camera: {
    constraints: {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: 30 },
        facingMode: { ideal: 'user' }
      }
    },
    settings: {
      width: 640,
      height: 480,
      frameRate: 30,  
      facingMode: 'user'
    }
  },
  sensitivity: defaultSensitivity,
  calibration: defaultCalibration,
  sampling: {
    rate: 30,
    interval: 33
  }
};

export const defaultSensitivity: SensitivitySettings = {
  brightness: 1.0,
  redIntensity: 1.0,
  signalAmplification: 1.0,
  noiseReduction: 0.5,
  peakDetection: 0.7,
  heartbeatThreshold: 0.5,
  responseTime: 1.0,
  signalStability: 0.8,
  filterStrength: 0.5,
  adaptiveThreshold: 0.3
};

export const defaultCalibration: CalibrationState = {
  isCalibrating: false,
  progress: 0,
  message: '',
  duration: 5000
};
