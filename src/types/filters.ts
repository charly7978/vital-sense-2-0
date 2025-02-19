
import { Float64Type } from './common';
import { FrequencyBands } from './analysis';

export interface FilterConfig {
  windowSize: number;
  sampleRate: number;
  lowCut: number;
  highCut: number;
  order: number;
  bands: FrequencyBands;
}

export interface FilterResult {
  filtered: Float64Type;
  bands: FrequencyBands;
}
