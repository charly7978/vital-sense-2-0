// Re-exportamos todos los tipos organizados
export * from './signal';
export * from './calibration';
export * from './processing';
export * from './wavelet';

// Tipos básicos que se mantienen aquí
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

// Helpers para crear tipos branded
export const createPercent = (n: number): Percent => Math.max(0, Math.min(100, n)) as Percent;
export const createBPM = (n: number): BPM => Math.max(0, Math.min(300, n)) as BPM;
export const createMilliseconds = (n: number): Milliseconds => Math.max(0, n) as Milliseconds;

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

// Tipos para la cámara
export interface MediaTrackConstraintsExtended extends MediaStreamConstraints {
  video?: {
    width: { ideal: number };
    height: { ideal: number };
    frameRate: { ideal: number };
    facingMode: { ideal: string };
  };
}

export type MeasurementType = 'ppg' | 'bp' | 'spo2' | 'resp';

// Tipos para detección de artefactos
export interface ArtifactConfig {
  sensitivity: number;
  threshold: number;
  windowSize: number;
}

export interface ArtifactFeatures {
  temporal: number[];
  spectral: number[];
  statistical: number[];
}

export interface MotionAnalysis {
  displacement: number[];
  velocity: number[];
  acceleration: number[];
}

// Tipos para análisis de frecuencia
export interface FrequencyConfig {
  sampleRate: number;
  windowSize: number;
  overlap: number;
}

export interface SpectralAnalysis {
  frequencies: number[];
  magnitudes: number[];
  phases: number[];
}

// Tipos para buffer circular
export interface CircularBuffer<T> {
  push(item: T): void;
  get(index: number): T;
  clear(): void;
  isFull(): boolean;
  length: number;
  capacity: number;
}

// Tipos para análisis de imágenes
export interface ROI {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ColorProfile {
  mean: number[];
  std: number[];
  histogram: number[][];
}

export interface DetectionQuality {
  overall: number;
  confidence: number;
  metrics: {
    coverage: number;
    stability: number;
    contrast: number;
  };
}

export interface TextureAnalysis {
  contrast: number;
  correlation: number;
  energy: number;
  homogeneity: number;
}

export interface DetectionError {
  code: string;
  message: string;
  timestamp: number;
}

// Tipos para movimiento y compensación
export interface MotionConfig {
  threshold: number;
  windowSize: number;
  sensitivity: number;
}

export interface MotionVector {
  dx: number;
  dy: number;
  magnitude: number;
  confidence: number;
}

export interface CompensationResult {
  compensated: Float64Array;
  quality: number;
  motion: MotionVector;
}

export interface FrameData {
  data: Uint8Array;
  width: number;
  height: number;
  timestamp: number;
}

export interface StabilityMetrics {
  temporal: number;
  spatial: number;
  overall: number;
}

export type CompensationMode = 'normal' | 'aggressive' | 'conservative';

export interface MotionEstimate {
  vector: MotionVector;
  confidence: number;
  quality: number;
}

export type QualityLevel = 'high' | 'medium' | 'low' | 'invalid';

// Tipos adicionales necesarios
export interface RegionAnalysis {
  roi: ROI;
  quality: DetectionQuality;
  features: any;
}

// Interfaces para umbrales adaptativos
export interface AdaptiveThreshold {
  current: number;
  min: number;
  max: number;
  alpha: number;
  update: (value: number, confidence: number) => void;
}

// Re-exportamos los tipos existentes
export type {
  WaveletBasis,
  WaveletCoefficients,
  SubbandFeatures
} from './wavelet';
