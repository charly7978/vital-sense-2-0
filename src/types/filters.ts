
import { FrequencyBands } from './analysis';

export interface FilterConfig {
  order: number;
  cutoff: number[];
  type: 'lowpass' | 'highpass' | 'bandpass';
  window?: 'hamming' | 'hanning' | 'blackman';
  sampleRate?: number;
  bands?: FrequencyBands;
  adaptive: boolean;
  bank: boolean;
  threshold?: number;
}
