import {
  FilterConfig,
  FrequencyBands
} from '@/types';

export class SignalFilter {
  private readonly config: FilterConfig = {
    order: 4,
    cutoff: [0.5, 8.0],
    type: 'bandpass',
    window: 'hamming',
    sampleRate: 30,
    bands: {
      vlf: [0.0, 0.04],
      lf: [0.04, 0.15],
      hf: [0.15, 0.4],
      total: [0.0, 0.4]
    },
    adaptive: false, // Changed from object to boolean
    bank: false     // Changed from object to boolean
  };
}
