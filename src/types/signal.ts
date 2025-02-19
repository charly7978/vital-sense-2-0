
// Tipos relacionados con el procesamiento de señales
export interface SignalConditions {
  noiseLevel: number;
  signalStrength: number;
  stability: number;
  signalQuality: number;
  lightLevel: number;
  movement: number;
  coverage: number;
  temperature: number;
  measurementType: string;
}

export interface SignalQuality {
  level: SignalQualityLevel;
  score: number;
  confidence: number;
  overall: number;
  history: Array<number>;
}

export interface NoiseAnalysis {
  snr: number;
  distribution: number[];
  spectrum: number[];
  entropy: number;
  kurtosis: number;
  variance: number;
}
