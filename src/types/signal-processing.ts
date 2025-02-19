
import { Float64Type } from './common';
import { SignalQuality } from './quality';
import { FrequencyBands } from './analysis';

export interface SignalProcessing {
  filter(signal: Float64Type): Float64Type;
  analyze(signal: Float64Type): SignalQuality;
  getBands(): FrequencyBands;
}
