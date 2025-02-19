// Tipos básicos para mediciones
export type Percent = number & { __brand: 'Percent' };
export type BPM = number & { __brand: 'BPM' };
export type Milliseconds = number & { __brand: 'Milliseconds' };

// Niveles de calidad de señal
export enum SignalQualityLevel {
  Excellent = 'excellent',
  Good = 'good',
  Fair = 'fair',
  Poor = 'poor',
  Invalid = 'invalid'
}

// Configuración de sensibilidad
export interface SensitivitySettings {
  brightness: number;
  redIntensity: number;
  signalAmplification: number;
  noiseReduction: number;
  peakDetection: number;
  heartbeatThreshold: number;
  responseTime: number;
  signalStability: number;
}

// Lectura vital individual
export interface VitalReading {
  timestamp: number;
  value: number;
  quality?: Percent;
}

// Datos PPG procesados
export interface PPGData {
  timestamp: number;
  bpm: number;
  spo2: Percent;
  systolic: number;
  diastolic: number;
  perfusionIndex: Percent;
  respiratoryRate: number;
  stressIndex: Percent;
  arrhythmia: boolean | null;
  quality: Percent;
  message: string;
  features: Record<string, number>;
  fingerDetection: FingerDetection;
  deviceInfo: DeviceInfo;
}

// Información de detección de dedo
export interface FingerDetection {
  quality: Percent;
  coverage: Percent;
  position?: { x: number; y: number };
}

// Información del dispositivo
export interface DeviceInfo {
  frameRate: number;
  resolution: {
    width: number;
    height: number;
  };
  lightLevel: Percent;
}

// Configuración de la cámara
export interface CameraConfig {
  constraints: MediaStreamConstraints;
  settings: {
    width: number;
    height: number;
    frameRate: number;
    facingMode: 'user' | 'environment';
  };
}

// Modo de procesamiento
export type ProcessingMode = 'normal' | 'calibration' | 'debug';

// Configuración del procesador PPG
export interface PPGConfig {
  frameRate: number;
  bufferSize: number;
  minQuality: Percent;
  calibrationTime: Milliseconds;
  processingInterval: Milliseconds;
}

// Configuración del analizador wavelet
export interface WaveletConfig {
  samplingRate: number;
  windowSize: number;
  scales: number[];
  waveletType: 'morlet' | 'mexican_hat';
}

// Configuración del filtro de señal
export interface SignalFilterConfig {
  samplingRate: number;
  cutoffLow: number;
  cutoffHigh: number;
  order: number;
}

// Helpers para crear tipos branded
export const createPercent = (n: number): Percent => Math.max(0, Math.min(100, n)) as Percent;
export const createBPM = (n: number): BPM => Math.max(0, Math.min(300, n)) as BPM;
export const createMilliseconds = (n: number): Milliseconds => Math.max(0, n) as Milliseconds;

// Tipo para el estado de calibración
export interface CalibrationState {
  isCalibrating: boolean;
  progress: Percent;
  message: string;
  results?: {
    baselineNoise: number;
    signalStrength: Percent;
    recommendations: string[];
  };
}

// Tipo para eventos del procesador
export type ProcessorEvent = 
  | { type: 'quality_change'; quality: Percent }
  | { type: 'finger_detected'; detection: FingerDetection }
  | { type: 'calibration_complete'; results: CalibrationState['results'] }
  | { type: 'error'; message: string };

// Características espectrales
export interface SpectralFeatures {
  heartRate: number[];
  variability: number[];
  respiratory: number[];
  artifacts: number[];
}

// Descomposición wavelet
export interface WaveletCoefficients {
  approximation: Float64Array;
  details: Float64Array[];
}

export interface SubbandFeatures {
  energy: number;
  entropy: number;
  variance: number;
  mean: number;
  level: number;
  type: string;
}

export interface WaveletBasis {
  filters: {
    decomposition: {
      lowPass: Float64Array;
      highPass: Float64Array;
    };
    reconstruction: {
      lowPass: Float64Array;
      highPass: Float64Array;
    };
  };
  support: number;
  vanishingMoments: number;
}

export interface WaveletPacket {
  tree: any;
  bestBasis: any;
  features: any;
  initialize(signal: Float64Array): void;
  decomposeAll(): void;
  selectBestBasis(costFunction: string): any;
  dispose(): void;
}

export interface ScaleSpace {
  energies: Float64Array;
  singularities: number[];
  maximalLines: number[][];
}

export interface OptimizedDWT {
  transform(signal: Float64Array): WaveletCoefficients;
  inverse(coefficients: WaveletCoefficients): Float64Array;
  dispose(): void;
}

export interface WaveletTransform {
  coefficients: WaveletCoefficients;
  subbands: SubbandFeatures[];
  packets: WaveletPacket;
  features: any;
  denoised: WaveletCoefficients;
  scaleSpace: ScaleSpace;
  reconstructed: Float64Array;
}
