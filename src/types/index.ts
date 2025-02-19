// Base numeric types
export type { Float64Type, Float32Type } from './common';

// Base enums and types
export type {
  ProcessingMode,
  ColorSpace,
  MeasurementType,
  BasicMetrics,
  ROI,
  MediaTrackConstraintsExtended,
  Disposable
} from './common';

// Quality types
export { SignalQualityLevel } from './quality';
export type { SignalQualityLevelType, SignalQuality } from './quality';

// Analysis types
export type {
  SpectralAnalysis,
  WaveletAnalysis,
  FrequencyBands,
  SpectralFeatures
} from './analysis';

// Signal processing types
export type {
  SignalConditions,
  CalibrationEntry,
  CalibratedResult,
  BeatConfig,
  BeatDetection,
  BeatFeatures,
  BeatQuality,
  BeatMetrics,
  TemplateMatching,
  PeakAnalysis,
  WaveformQuality,
  QualityMetrics,
  BeatMorphology,
  BeatValidation
} from './signal-processing';

// Configuration types
export type {
  ProcessingConfig,
  CalibrationState,
  SensitivitySettings,
  FilterConfig,
  FrequencyConfig
} from './config';

// Vital signs types
export type {
  VitalReading,
  PPGData,
  VitalMeasurement,
  VitalConfig,
  ProcessingState,
  PPGProcessingConfig,
  ProcessorMetrics
} from './vitals';

// Declare global Float64Array interface
declare global {
  interface Float64Array extends ArrayLike<number> {
    readonly BYTES_PER_ELEMENT: number;
    readonly buffer: ArrayBufferLike;
    readonly byteLength: number;
    readonly byteOffset: number;
    copyWithin(target: number, start: number, end?: number): this;
    every(predicate: (value: number, index: number, array: Float64Array) => unknown): boolean;
    fill(value: number, start?: number, end?: number): this;
    filter(predicate: (value: number, index: number, array: Float64Array) => unknown): Float64Array;
    find(predicate: (value: number, index: number, array: Float64Array) => unknown): number | undefined;
    findIndex(predicate: (value: number, index: number, array: Float64Array) => unknown): number;
    forEach(callbackfn: (value: number, index: number, array: Float64Array) => void): void;
    includes(searchElement: number, fromIndex?: number): boolean;
    indexOf(searchElement: number, fromIndex?: number): number;
    join(separator?: string): string;
    lastIndexOf(searchElement: number, fromIndex?: number): number;
    map(callbackfn: (value: number, index: number, array: Float64Array) => number): Float64Array;
    reduce<U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Float64Array) => U, initialValue: U): U;
    reduceRight<U>(callbackfn: (previousValue: U, currentValue: number, currentIndex: number, array: Float64Array) => U, initialValue: U): U;
    reverse(): Float64Array;
    set(array: ArrayLike<number>, offset?: number): void;
    slice(start?: number, end?: number): Float64Array;
    some(predicate: (value: number, index: number, array: Float64Array) => unknown): boolean;
    sort(compareFn?: (a: number, b: number) => number): Float64Array;
    subarray(begin: number, end?: number): Float64Array;
    toLocaleString(): string;
    toString(): string;
    valueOf(): Float64Array;
  }
}
