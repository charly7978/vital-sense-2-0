
import { SignalQualityLevel } from '../types/quality';
import { 
  ProcessingConfig, 
  SensitivitySettings,
  CalibrationState
} from '../types/config';

const defaultSensitivity: SensitivitySettings = {
  brightness: 1.0,
  redIntensity: 1.2,
  signalAmplification: 1.0,
  noiseReduction: 0.8,
  peakDetection: 0.3,
  heartbeatThreshold: 0.5,
  responseTime: 100,
  signalStability: 0.7
};

const defaultCalibration: CalibrationState = {
  isCalibrating: false,
  progress: 0,
  message: '',
  isCalibrated: false,
  calibrationTime: 0,
  referenceValues: new Float64Array(512),
  calibrationQuality: 0
};

export const config = {
  camera: {
    constraints: {
      video: {
        facingMode: 'environment'
      }
    },
    settings: {
      width: 640,
      height: 480
    }
  },
  processing: {
    sampleRate: 30,
    bufferSize: 512,
    windowSize: 256,
    mode: 'normal' as const,
    sensitivity: defaultSensitivity,
    calibration: defaultCalibration,
    optimization: {
      vectorization: true,
      parallelization: true,
      precision: 'double' as const,
      cacheSize: 1024,
      adaptiveWindow: true
    }
  },
  sensitivity: defaultSensitivity,
  calibration: defaultCalibration,
  analysis: {
    mode: 'normal' as const,
    quality: {
      minConfidence: 0.6,
      maxArtifacts: 0.3,
      minAmplitude: 0.1,
      waveformStability: 0.7
    },
    frequency: {
      minHz: 0.5,
      maxHz: 4.0,
      resolution: 0.1
    }
  },
  validation: {
    minQuality: SignalQualityLevel.Fair,
    maxError: 0.2,
    minConfidence: 0.6
  }
};

export default config;
