
export interface VitalReading {
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
  signalQuality: number;
  confidence: number;
  readings: VitalReading[];
  isPeak: boolean;
  hrvMetrics: {
    sdnn: number;
    rmssd: number;
    pnn50: number;
    lfhf: number;
  };
}
