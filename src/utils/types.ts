
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
  [key: string]: number; // Add index signature
  signalAmplification: number;
  noiseReduction: number;
  peakDetection: number;
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
