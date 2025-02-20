export interface VitalReading {
  [key: string]: number;
  timestamp: number;
  value: number;
}

export interface PPGData {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  hasArrhythmia: boolean;
  arrhythmiaType: string;
  confidence: number;
  readings: VitalReading[];
  isPeak?: boolean;
  signalQuality: number;
  hrvMetrics?: {
    sdnn: number;
    rmssd: number;
    pnn50: number;
    lfhf: number;
  };
}

export interface SensitivitySettings {
  [key: string]: number;
  signalAmplification: number;
  noiseReduction: number;
  peakDetection: number;
  heartbeatThreshold: number;
  responseTime: number;
  signalStability: number;
  brightness?: number;
  redIntensity?: number;
}

export interface ProcessingSettings {
  MEASUREMENT_DURATION: number;
  MIN_FRAMES_FOR_CALCULATION: number;
  MIN_PEAKS_FOR_VALID_HR: number;
  MIN_PEAK_DISTANCE: number;
  MAX_PEAK_DISTANCE: number;
  PEAK_THRESHOLD_FACTOR: number;
  MIN_RED_VALUE: number;
  MIN_RED_DOMINANCE: number;
  MIN_VALID_PIXELS_RATIO: number;
  MIN_BRIGHTNESS: number;
  MIN_VALID_READINGS: number;
  FINGER_DETECTION_DELAY: number;
  MIN_SPO2: number;
}

export interface CalibrationSettings {
  [key: string]: {
    value: number;
    min: number;
    max: number;
    step: number;
    description: string;
  };
}

export interface BPCalibrationData {
  calibration_type: 'blood_pressure';
  calibration_values: {
    systolic_reference: number;
    diastolic_reference: number;
  };
  environmental_data: {
    timestamp: string;
    device_type: string;
  };
  reference_measurements: {
    age?: number;
    weight?: number;
    height?: number;
    notes?: string;
  };
  is_active: boolean;
}

export interface RawSignal {
  red: number[];
  ir: number[];
  quality: number;
}

export interface QuantumSignal {
  data: number[];
  quality: number;
  phase: number;
}

export interface SpectralData {
  frequencies: number[];
  amplitudes: number[];
  phase: number[];
  signal: number[];
  features: any;
  quality: number;
}

export interface ProcessedData {
  signal: number[];
  features: any;
  quality: number;
}

export interface OptimizedSignal {
  data: number[];
  quality: number;
  confidence: number;
}

export interface ValidatedSignal {
  data: number[];
  quality: number;
  features: SignalFeatures;
}

export interface SignalFeatures {
  peaks: number[];
  valleys: number[];
  frequency: number;
  amplitude: number;
  perfusionIndex: number;
}

export interface ROI {
  region: ImageData;
  quality: number;
}

export interface Channels {
  red: number[];
  ir: number[];
  ambient: number[];
}

export interface ProcessedPPGSignal {
  signal: ValidatedSignal;
  quality: number;
  features: SignalFeatures;
  confidence: number;
  timestamp: number;
}

export class ProcessingError extends Error {
  constructor(message: string, public originalError?: any) {
    super(message);
    this.name = 'ProcessingError';
  }
}

export interface DisplayConfig {
  refreshRate: number;
  interpolation: string;
}

export interface VisualizerConfig {
  updateRate: number;
  smoothing: boolean;
}

export interface AlertConfig {
  visual: boolean;
  haptic: boolean;
  audio: boolean;
}

export interface Alert {
  type: string;
  message: string;
  suggestion?: string;
  priority: 'low' | 'medium' | 'high';
}

export interface SignalData {
  signal?: number[];
  quality?: SignalQuality;
  data?: any;
  timestamp: number;
}

export interface SignalQuality {
  snr: number;
  stability: number;
  artifacts: number;
  overall: number;
}

export interface QualityMetrics {
  snr: number;
  stability: number;
  artifacts: number;
  overall: number;
}

export interface QualityIndicators {
  snr: Indicator;
  stability: Indicator;
  artifacts: Indicator;
  overall: Indicator;
}

interface Indicator {
  setValue(value: number): void;
}
