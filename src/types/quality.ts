
export const SignalQualityLevel = {
  Excellent: 'excellent',
  Good: 'good',
  Fair: 'fair',
  Poor: 'poor',
  Invalid: 'invalid'
} as const;

export type SignalQualityLevelType = typeof SignalQualityLevel[keyof typeof SignalQualityLevel];

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
}
