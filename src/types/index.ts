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

// Tipos para la cámara
export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width: { ideal: number };
  height: { ideal: number };
  frameRate: { ideal: number };
  facingMode: { ideal: string };
}

export interface ExtendedMediaTrackCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

// Tipos para procesamiento de señal
export interface SignalConditions {
  noiseLevel: number;
  signalStrength: number;
  stability: number;
}

export interface CalibrationEntry {
  timestamp: number;
  values: number[];
  conditions: SignalConditions;
}

export interface CalibratedResult {
  isValid: boolean;
  values: number[];
  quality: number;
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

export interface SignalQuality {
  level: SignalQualityLevel;
  score: number;
  confidence: number;
}

export interface MotionAnalysis {
  displacement: number[];
  velocity: number[];
  acceleration: number[];
}

export interface NoiseAnalysis {
  snr: number;
  distribution: number[];
  spectrum: number[];
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

// Tipos para configuración y procesamiento
export interface ProcessingConfig {
  mode: ProcessingMode;
  sensitivity: SensitivitySettings;
  calibration: CalibrationState;
}

export interface ProcessingState {
  isProcessing: boolean;
  frameCount: number;
  quality: SignalQuality;
  calibration: CalibrationState;
}

export interface QualityParams {
  signal: number[];
  noise: NoiseAnalysis;
  motion: MotionAnalysis;
}

export interface ProcessorMetrics {
  frameRate: number;
  processingTime: number;
  memoryUsage: number;
  quality: SignalQuality;
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

// Tipos para el sistema
export interface SystemConfig {
  processing: ProcessingConfig;
  camera: CameraConfig;
  sensitivity: SensitivitySettings;
  calibration: CalibrationState;
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

// Re-exportar otros tipos necesarios
export type { WaveletBasis, WaveletCoefficients, SubbandFeatures } from './wavelet';

// Tipos para umbral adaptativo
export interface AdaptiveThreshold {
  current: number;
  min: number;
  max: number;
  alpha: number;
  update: (value: number, confidence: number) => void;
}

// Re-exportamos los tipos existentes
export type {
  Percent,
  BPM,
  Milliseconds,
  SignalQualityLevel,
  SensitivitySettings,
  VitalReading,
  PPGData,
  FingerDetection,
  DeviceInfo,
  CameraConfig,
  ProcessingMode,
  PPGConfig,
  WaveletConfig,
  SignalFilterConfig,
  CalibrationState,
  ProcessorEvent,
  SpectralFeatures,
  WaveletCoefficients,
  SubbandFeatures
};
