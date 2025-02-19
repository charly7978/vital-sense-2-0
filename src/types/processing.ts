
// Tipos para procesamiento
export interface ProcessingConfig {
  mode: 'normal' | 'calibration' | 'debug';
  sampleRate?: number;
  sensitivity: SensitivitySettings;
  calibration: CalibrationState;
}

export interface ProcessingState {
  isProcessing: boolean;
  frameCount: number;
  calibration: CalibrationState;
  optimization?: {
    cache: boolean;
    performance: boolean;
    memory: boolean;
  };
  startTime: number;
  errorCount: number;
  lastProcessingTime: number;
}

export interface ProcessorMetrics {
  frameRate: number;
  processingTime: number;
  memoryUsage: number;
  quality: SignalQuality;
  errorRate: number;
}

export interface QualityParams {
  signal: number[];
  noise: NoiseAnalysis;
  motion: MotionAnalysis;
  heartRate: number;
  features: any;
}
