
export interface VitalReading {
  [key: string]: number;
  timestamp: number;
  value: number;
}

export interface PPGData {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  hasArrhythmia: boolean;
  arrhythmiaType: string;
  confidence: number;
  readings: VitalReading[];
  isPeak?: boolean;
  signalQuality: number;
  redValue: number;  // Añadimos esta propiedad
  hrvMetrics?: {
    sdnn: number;
    rmssd: number;
    pnn50: number;
    lfhf: number;
  };
}

export interface SensitivitySettings {
  [key: string]: number;
  signalAmplification: number;
  noiseReduction: number;
  peakDetection: number;
}

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

export interface CalibrationSettings {
  [key: string]: {
    value: number;
    min: number;
    max: number;
    step: number;
    description: string;
  };
}

export interface BPCalibrationData {
  id?: string;
  systolic_reference: number;
  diastolic_reference: number;
  age?: number;
  weight?: number;
  height?: number;
  calibration_date?: string;
  is_active?: boolean;
  calibration_quality?: number;
  notes?: string;
  environmental_conditions?: Record<string, any>;
}
