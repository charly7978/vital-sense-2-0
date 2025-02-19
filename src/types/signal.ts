
import { Float64Type } from './common';
import { Metadata, ValidationResult } from './core';

export interface SignalSegment {
  data: Float64Type;
  metadata: Metadata;
  validation: ValidationResult;
}
