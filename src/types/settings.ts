
export interface ProcessingSettings {
  MEASUREMENT_DURATION: number;
  MIN_FRAMES_FOR_CALCULATION: number;
  MIN_PEAKS_FOR_VALID_HR: number;
  MIN_PEAK_DISTANCE: number;
  MAX_PEAK_DISTANCE: number;
  PEAK_THRESHOLD_FACTOR: number;
  MIN_RED_VALUE: number;
  MIN_RED_DOMINANCE: number;
  MIN_VALID_PIXELS_RATIO: number;
  MIN_BRIGHTNESS: number;
  MIN_VALID_READINGS: number;
  FINGER_DETECTION_DELAY: number;
  MIN_SPO2: number;
}

export interface SensitivitySettings {
  signalAmplification: number;
  noiseReduction: number;
  peakDetection: number;
  heartbeatThreshold: number;
  responseTime: number;
  signalStability: number;
  brightness: number;
  redIntensity: number;
}
