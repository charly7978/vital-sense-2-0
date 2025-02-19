
export const SignalQualityLevel = {
  Excellent: 'excellent',
  Good: 'good',
  Fair: 'fair',
  Poor: 'poor',
  Invalid: 'invalid'
} as const;

export type SignalQualityLevelType = typeof SignalQualityLevel[keyof typeof SignalQualityLevel];

export interface QualityConfig {
  noise: number;
  frequency: number;
  amplitude: number;
  wavelet?: {
    type: string;
    level: number;
    threshold: number;
  };
  windowSize?: number;
  validation?: {
    minQuality: number;
    maxError: number;
  };
  analysis?: {
    minQuality: number;
    maxArtifacts: number;
  };
}

export interface SignalQuality {
  level: SignalQualityLevelType;
  score: number;
  confidence: number;
  overall: number;
  history: number[];
  noise?: number;
  frequency?: number;
  amplitude?: number;
  threshold?: number;
  dispose?: () => void;
}

export interface QualityMetrics {
  snr: number;
  artifacts: number;
  stability: number;
  noise: number;
  frequency: number;
  amplitude: number;
  overall: number;
  confidence: number;
  metrics?: any;
}

export interface SignalStability {
  temporal: number;
  spectral: number;
  phase: number;
  overall: number;
  dispose: () => void;
}
