
export interface VitalReading {
  timestamp: number;
  value: number;
}

export interface PPGData {
  bpm: number;
  spo2: number;
  confidence: number;
  readings: VitalReading[];
}
