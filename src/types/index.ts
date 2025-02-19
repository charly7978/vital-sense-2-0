// Base types
export type {
  Float64Type,
  Float32Type,
  ProcessingMode,
  ColorSpace,
  MeasurementType,
  BasicMetrics,
  ROI,
  MediaTrackConstraintsExtended,
  Disposable
} from './common';

// Quality types and constants
export { SignalQualityLevel } from './quality';
export type { SignalQualityLevelType, SignalQuality } from './quality';

// Other type exports
export * from './analysis';
export * from './config';
export * from './vitals';
export * from './camera';

// Global declarations
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
