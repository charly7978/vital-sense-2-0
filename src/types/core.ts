
import { Float64Type, Disposable } from './common';
import { SignalQuality } from './quality';
import { NoiseAnalysis, MotionAnalysis } from './artifacts';

export interface SignalProcessor extends Disposable {
  process(signal: Float64Type): SignalQuality;
  analyze(signal: Float64Type): {
    noise: NoiseAnalysis;
    motion: MotionAnalysis;
  };
}
