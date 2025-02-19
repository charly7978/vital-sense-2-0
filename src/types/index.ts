
// Export only what's needed and avoid duplicates
export type {
  // Common types
  Float64Type,
  Float32Type,
  ProcessingMode,
  ColorSpace,
  MeasurementType,
  SignalQualityLevelType,
  Disposable,
  BasicMetrics,
  ROI
} from './common';

// Quality types
export type {
  SignalQuality,
  QualityMetrics
} from './quality';

// Config types
export type {
  CalibrationState,
  ProcessingConfig,
  SensitivitySettings
} from './config';

// Artifact types
export type {
  ArtifactConfig,
  ArtifactDetection,
  ArtifactFeatures,
  ArtifactMetrics,
  MotionAnalysis,
  NoiseAnalysis,
  ArtifactValidation,
  ArtifactClassification,
  SignalSegmentation
} from './artifacts';

// Analysis types
export type {
  IntervalAnalysis,
  SpectralAnalysis,
  FrequencyAnalysis,
  PhaseAnalysis,
  FrequencyBands,
  ComplexArray,
  WaveformQuality,
  // Wavelet types
  WaveletCoefficients,
  WaveletTransform,
  WaveletBasis,
  WaveletPacket,
  ScaleSpace,
  SubbandFeatures,
  OptimizedDWT,
  WaveletAnalysis
} from './analysis';

// Vital types
export type {
  VitalReading,
  PPGData,
  PPGProcessingConfig,
  ProcessingState
} from './vitals';

// Only export constants normally
export { SignalQualityLevel } from './quality';

