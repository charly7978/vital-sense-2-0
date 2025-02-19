
// Base types
export type Percent = number & { __brand: 'Percent' };
export type BPM = number & { __brand: 'BPM' };
export type Milliseconds = number & { __brand: 'Milliseconds' };

// Signal Quality types
export enum SignalQualityLevel {
  Excellent = 'excellent',
  Good = 'good',
  Fair = 'fair',
  Poor = 'poor',
  Invalid = 'invalid'
}

// Measurement types
export type MeasurementType = 'ppg' | 'bp' | 'spo2' | 'resp';

// Core data interfaces
export interface PPGData {
  timestamp: number;
  values: number[];
  bpm: number;
  confidence: number;
}

export interface VitalReading {
  timestamp: number;
  value: number;
  quality: number;
  type: MeasurementType;
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
  dispose?: () => void;
}

// Calibration interfaces
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

// Analysis interfaces
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
  dispose?: () => void;
}

export interface MotionAnalysis {
  displacement: number[];
  velocity: number[];
  acceleration: number[];
  threshold?: number;
  features?: any[];
  dispose?: () => void;
}

// Signal processing interfaces
export interface SignalConditions {
  brightness: number;
  contrast: number;
  noise: number;
  stability: number;
}

export interface CalibrationEntry {
  timestamp: number;
  values: Float64Array;
  conditions: SignalConditions;
  quality: number;
}

export interface CalibratedResult {
  isCalibrated: boolean;
  referenceValues?: Float64Array;
  quality?: number;
  timestamp?: number;
}

// Artifact detection interfaces
export interface ArtifactConfig {
  threshold: number;
  windowSize: number;
  mode: 'default' | 'strict' | 'lenient';
  sampleRate?: number;
  overlapSize?: number;
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
  artifacts?: ArtifactFeatures;
  features?: any;
  motion?: any;
  dispose?: () => void;
}

export interface ArtifactFeatures {
  motion: MotionAnalysis;
  noise: NoiseAnalysis;
  quality: SignalQuality;
}

export interface ArtifactClassification {
  type: string;
  confidence: number;
  features: any[];
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
}

// Processing configuration interfaces
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

export interface ProcessorMetrics {
  snr: number;
  bpm: number;
  quality: SignalQuality;
  timestamp: number;
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

// Helper functions
export const createPercent = (n: number): Percent => Math.max(0, Math.min(100, n)) as Percent;
export const createBPM = (n: number): BPM => Math.max(0, Math.min(300, n)) as BPM;
export const createMilliseconds = (n: number): Milliseconds => Math.max(0, n) as Milliseconds;
