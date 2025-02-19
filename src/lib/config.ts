
import { ProcessingConfig } from '../types/config';

export const config: ProcessingConfig = {
  mode: 'normal',
  sampleRate: 30,
  sensitivity: {
    brightness: 1.0,
    redIntensity: 1.2,
    signalAmplification: 1.5,
    noiseReduction: 0.8,
    peakDetection: 0.7,
    heartbeatThreshold: 0.6,
    responseTime: 100,
    signalStability: 0.9
  },
  calibration: {
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
    lastCalibration: 0
  },
  filter: {
    enabled: true,
    lowCut: 0.5,
    highCut: 4.0,
    order: 4,
    nfft: 512
  },
  bufferSize: 512,
  filterOrder: 4,
  lowCutoff: 0.5,
  highCutoff: 4.0,
  peakThreshold: 0.3,
  minPeakDistance: 0.3,
  calibrationDuration: 5000,
  adaptiveThreshold: true,
  validation: {
    minQuality: 0.7,
    maxArtifacts: 3
  }
};
