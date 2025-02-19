
// IMPORTANTE: NO MODIFICAR FUNCIONALIDAD
// Este archivo solo contiene definiciones de tipos

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

export interface MotionAnalysis {
  displacement: number[];
  velocity: number[];
  acceleration: number[];
}

// NO MODIFICAR: Mantener compatibilidad con implementaciones existentes
export interface SignalFeatures {
  temporal: number[];
  spectral: number[];
  statistical: number[];
}
