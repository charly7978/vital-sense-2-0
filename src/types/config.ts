
export interface SystemConfig {
  processing: ProcessingConfig;
  camera: CameraConfig;
  sensitivity: SensitivitySettings;
  calibration: CalibrationState;
  sampling?: {
    rate: number;
    interval: number;
  };
}

export interface SensitivitySettings {
  brightness: number;
  redIntensity: number;
  signalAmplification: number;
  noiseReduction: number;
  peakDetection: number;
  heartbeatThreshold: number;
  responseTime: number;
  signalStability: number;
  filterStrength?: number;
  adaptiveThreshold?: number;
}
