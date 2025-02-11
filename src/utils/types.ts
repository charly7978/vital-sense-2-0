
export interface VitalReading {
  timestamp: number;
  value: number;
}

export interface PPGData {
  bpm: number;
  confidence: number;
  readings: VitalReading[];
}
