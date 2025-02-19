
// Re-export all types
export * from './common';
export * from './analysis';
export * from './config';
export * from './quality';
export * from './vitals';
export * from './camera';

// Declare global Float64Array type
declare global {
  // This matches the native Float64Array type more closely
  type Float64Array = {
    [index: number]: number;
    length: number;
    BYTES_PER_ELEMENT: number;
    buffer: ArrayBuffer;
    byteLength: number;
    byteOffset: number;
    set(array: ArrayLike<number>, offset?: number): void;
    subarray(begin: number, end?: number): Float64Array;
    slice(start?: number, end?: number): Float64Array;
    fill(value: number, start?: number, end?: number): Float64Array;
  };
}
