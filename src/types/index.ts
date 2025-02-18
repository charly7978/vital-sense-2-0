
// Tipos de base más específicos
export type Percentage = number & { __brand: 'Percentage' };
export type Milliseconds = number & { __brand: 'Milliseconds' };
export type BPM = number & { __brand: 'BPM' };
export type BloodPressure = number & { __brand: 'BloodPressure' };

// Enums más detallados para estados y tipos
export enum SignalQualityLevel {
  Excellent = 'Excellent',
  Good = 'Good',
  Fair = 'Fair',
  Poor = 'Poor',
  Invalid = 'Invalid'
}

export enum ArrhythmiaType {
  Normal = 'Normal',
  SinusArrhythmia = 'SinusArrhythmia',
  PrematureBeats = 'PrematureBeats',
  AFib = 'AFib',
  Unknown = 'Unknown'
}

// Configuraciones avanzadas con validación incorporada
export interface SensitivitySettings {
  signalAmplification: number & { __range: [1.0, 5.0] };
  noiseReduction: number & { __range: [0.1, 3.0] };
  peakDetection: number & { __range: [0.5, 2.0] };
  heartbeatThreshold: number & { __range: [0.3, 1.0] };
  responseTime: Milliseconds;
  signalStability: Percentage;
  brightness: Percentage;
  redIntensity: Percentage;
  adaptiveThreshold: boolean;
  autoCalibration: boolean;
  filterStrength: number & { __range: [1, 10] };
}

// Interfaz principal mejorada con métricas avanzadas
export interface PPGData {
  // Métricas vitales básicas
  bpm: BPM;
  spo2: Percentage;
  systolic: BloodPressure;
  diastolic: BloodPressure;
  
  // Análisis avanzado
  hasArrhythmia: boolean;
  arrhythmiaType: ArrhythmiaType;
  hrv: {
    sdnn: number;    // Desviación estándar de intervalos NN
    rmssd: number;   // Raíz cuadrada media de diferencias sucesivas
    pnn50: number;   // Porcentaje de intervalos NN que difieren por más de 50ms
  };
  
  // Calidad y confianza
  confidence: Percentage;
  signalQuality: SignalQualityLevel;
  signalToNoiseRatio: number;
  
  // Datos técnicos
  readings: Float32Array;  // Más eficiente que number[]
  peaks: {
    positions: number[];
    amplitudes: number[];
    widths: number[];
  };
  
  // Métricas avanzadas
  perfusionIndex: number;
  stressIndex: number;
  respirationRate: number;
  
  // Metadatos
  timestamp: Milliseconds;
  processingTime: Milliseconds;
  deviceInfo: {
    frameRate: number;
    resolution: { width: number; height: number };
    lightLevel: Percentage;
  };
}

// Interfaces para el procesamiento en tiempo real
export interface ProcessedFrame {
  timestamp: Milliseconds;
  raw: Float32Array;
  filtered: Float32Array;
  quality: SignalQualityLevel;
  features: {
    brightness: Percentage;
    contrast: Percentage;
    movement: Percentage;
    redChannel: Percentage;
  };
}

// Métricas vitales completas
export interface VitalSigns {
  bpm: BPM;
  spo2: Percentage;
  systolic: BloodPressure;
  diastolic: BloodPressure;
  perfusionIndex: number;
  respirationRate: number;
  stressLevel: number & { __range: [0, 100] };
  quality: SignalQualityLevel;
}

// Configuración del sistema
export interface SystemConfig {
  sampling: {
    rate: number;
    bufferSize: number;
    windowSize: number;
  };
  filtering: {
    lowCutoff: number;
    highCutoff: number;
    order: number;
  };
  analysis: {
    minQuality: Percentage;
    peakDetectionSensitivity: number;
    arrhythmiaThreshold: number;
  };
  calibration: {
    duration: Milliseconds;
    minSamples: number;
    targetQuality: Percentage;
  };
}

// Tipos extendidos para MediaStream
export interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

export interface MediaTrackConstraintSet {
  torch?: boolean;
}

export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  advanced?: MediaTrackConstraintSet[];
}
