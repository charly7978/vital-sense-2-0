
// Basic Types
export type Percent = number & { __brand: 'Percent' };
export type BPM = number & { __brand: 'BPM' };
export type Milliseconds = number & { __brand: 'Milliseconds' };

// Media Types
export interface MediaTrackConstraintsExtended extends MediaTrackConstraints {
  width?: { ideal: number };
  height?: { ideal: number };
  facingMode?: 'user' | 'environment';
  frameRate?: { ideal: number };
  advanced?: {
    exposureMode?: string;
    exposureTime?: number;
    exposureCompensation?: number;
    brightness?: number;
    contrast?: number;
    whiteBalanceMode?: string;
    colorTemperature?: number;
    saturation?: number;
    sharpness?: number;
    torch?: boolean;
  }[];
}

// Signal Quality Types
export enum SignalQualityLevel {
  Excellent = 'excellent',
  Good = 'good',
  Fair = 'fair',
  Poor = 'poor',
  Invalid = 'invalid'
}

export interface SignalQuality {
  level: SignalQualityLevel;
  score: number;
  confidence: number;
  overall: number;
  history: number[];
  signal?: number;
  noise?: number;
  movement?: number;
  threshold?: number;
  dispose?: () => void;
}

// Processing Types
export type MeasurementType = 'ppg' | 'bp' | 'spo2' | 'resp';

export interface VitalReading {
  timestamp: number;
  value: number;
  quality: number;
  type: MeasurementType;
}

export interface PPGData {
  timestamp: number;
  values: number[];
  bpm: number;
  confidence: number;
}

// Signal Analysis Types
export interface NoiseAnalysis {
  snr: number;
  distribution: number[];
  spectrum: number[];
  entropy: number;
  kurtosis: number;
  variance: number;
  spectralNoise?: number;
  threshold?: number;
  waveletNoise?: number;
  impulseNoise?: number;
  dispose?: () => void;
}

export interface MotionAnalysis {
  displacement: number[];
  velocity: number[];
  acceleration: number[];
  threshold?: number;
  features?: any[];
  detection?: number;
  dispose?: () => void;
}

// Calibration Types
export interface CalibrationState {
  isCalibrating: boolean;
  progress: number;
  message: string;
  isCalibrated?: boolean;
  calibrationTime?: number;
  lastCalibration?: number;
  referenceValues?: Float64Array;
  calibrationQuality?: number;
}

export interface SignalConditions {
  brightness: number;
  contrast: number;
  noise: number;
  stability: number;
  signalQuality: number;
  lightLevel: number;
  movement: number;
  coverage: number;
  temperature: number;
  measurementType?: MeasurementType;
}

export interface CalibrationEntry {
  timestamp: number;
  values: Float64Array;
  conditions: SignalConditions;
  quality: number;
  factor: number;
  raw?: number;
}

export interface CalibratedResult {
  isCalibrated: boolean;
  referenceValues?: Float64Array;
  quality?: number;
  timestamp?: number;
  value?: number;
}

// Processing Configuration Types
export interface ProcessingConfig {
  mode: 'normal' | 'calibration' | 'debug';
  sampleRate?: number;
  sensitivity: SensitivitySettings;
  calibration: CalibrationState;
  bufferSize: number;
  filterOrder: number;
  lowCutoff: number;
  highCutoff: number;
  peakThreshold: number;
  minPeakDistance: number;
  calibrationDuration: number;
  adaptiveThreshold: boolean;
}

export interface ProcessingState {
  isProcessing: boolean;
  frameCount: number;
  buffer: Float64Array;
  timeBuffer: Float64Array;
  lastTimestamp: number;
  sampleRate: number;
  calibration: CalibrationState;
  quality: SignalQuality;
  optimization: {
    cache: Map<string, any>;
    performance: Map<string, number>;
    resources: Map<string, number>;
  };
}

export interface ProcessorMetrics {
  snr: number;
  bpm: number;
  quality: SignalQuality;
  timestamp: number;
}

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

// Wavelet Analysis Types
export interface WaveletCoefficients {
  approximation: Float64Array;
  details: Float64Array[];
}

export interface SubbandFeatures {
  energy: number[];
  entropy: number[];
  variance: number[];
}

export interface WaveletTransform {
  coefficients: WaveletCoefficients;
  features: SubbandFeatures;
}

export interface WaveletBasis {
  name: string;
  coefficients: Float64Array;
}

export interface WaveletPacket {
  coefficients: WaveletCoefficients;
  features: SubbandFeatures;
}

export interface ScaleSpace {
  scales: Float64Array[];
  frequencies: number[];
}

export interface OptimizedDWT {
  transform: (signal: Float64Array) => WaveletTransform;
  inverse: (coeffs: WaveletCoefficients) => Float64Array;
}

// Artifact Detection Types
export interface ArtifactConfig {
  threshold: number;
  windowSize: number;
  mode: 'default' | 'strict' | 'lenient';
  sampleRate?: number;
  overlapSize?: number;
  wavelet?: {
    decompositionLevel: number;
    waveletType: string;
  };
  validation?: {
    minConfidence: number;
    maxArtifacts: number;
  };
  noise?: {
    methods: string[];
    thresholds: Record<string, number>;
  };
  motion?: {
    threshold: number;
    window: number;
    features: string[];
    fusion: string;
  };
}

export interface ArtifactDetection {
  isArtifact: boolean;
  confidence: number;
  type?: string;
  segments?: SignalSegmentation;
  artifacts?: ArtifactFeatures;
  features?: any;
  motion?: any;
  saturation?: boolean;
  disposal?: () => void;
}

export interface ArtifactFeatures {
  motion: MotionAnalysis;
  noise: NoiseAnalysis;
  quality: SignalQuality;
}

export interface SignalSegmentation {
  segments: Float64Array[];
  timestamps: number[];
  quality: number[];
}

export interface ArtifactMetrics {
  noise: number;
  motion: number;
  quality: number;
  overall: number;
}

export interface ArtifactValidation {
  isValid: boolean;
  confidence: number;
  metrics: ArtifactMetrics;
  dispose?: () => void;
}

export interface TemplateMatching {
  similarity: number;
  offset: number;
  scale: number;
}

export interface SpectralAnalysis {
  spectrum: Float64Array;
  frequencies: Float64Array;
  magnitude: Float64Array;
  phase: Float64Array;
  dispose?: () => void;
}

// Helper functions
export const createPercent = (n: number): Percent => Math.max(0, Math.min(100, n)) as Percent;
export const createBPM = (n: number): BPM => Math.max(0, Math.min(300, n)) as BPM;
export const createMilliseconds = (n: number): Milliseconds => Math.max(0, n) as Milliseconds;

