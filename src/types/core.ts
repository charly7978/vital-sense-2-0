
export interface Metadata {
  timestamp: number;
  version: string;
  source: string;
}

export interface ValidationResult {
  isValid: boolean;
  score: number;
  details: string[];
}
