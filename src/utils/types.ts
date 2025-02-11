
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
  measurementDuration: number;
  minFramesForCalculation: number;
  minPeaksForValidHR: number;
  minPeakDistance: number;
  maxPeakDistance: number;
  peakThresholdFactor: number;
  minRedValue: number;
  minRedDominance: number;
  minValidPixelsRatio: number;
  minBrightness: number;
  minValidReadings: number;
  fingerDetectionDelay: number;
  minSpO2: number;
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
