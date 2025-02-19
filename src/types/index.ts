
// Re-export all types from their respective modules
export * from './common';
export * from './analysis';
export * from './config';
export * from './quality';
export * from './vitals';
export * from './camera';

// Declare global Float64Array type
declare global {
  type Float64Array = {
    [index: number]: number;
    length: number;
    readonly BYTES_PER_ELEMENT: number;
    readonly buffer: ArrayBuffer;
    readonly byteLength: number;
    readonly byteOffset: number;
    copyWithin(target: number, start: number, end?: number): Float64Array;
    every(predicate: (value: number, index: number, array: Float64Array) => unknown): boolean;
    fill(value: number, start?: number, end?: number): Float64Array;
    filter(predicate: (value: number, index: number, array: Float64Array) => unknown): Float64Array;
    find(predicate: (value: number, index: number, array: Float64Array) => unknown): number | undefined;
    findIndex(predicate: (value: number, index: number, array: Float64Array) => unknown): number;
    forEach(callbackfn: (value: number, index: number, array: Float64Array) => void): void;
    includes(searchElement: number, fromIndex?: number): boolean;
    indexOf(searchElement: number, fromIndex?: number): number;
    join(separator?: string): string;
    lastIndexOf(searchElement: number, fromIndex?: number): number;
    map(callbackfn: (value: number, index: number, array: Float64Array) => number): Float64Array;
    reduce(callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Float64Array) => number): number;
    reduceRight(callbackfn: (previousValue: number, currentValue: number, currentIndex: number, array: Float64Array) => number): number;
    reverse(): Float64Array;
    set(array: ArrayLike<number>, offset?: number): void;
    slice(start?: number, end?: number): Float64Array;
    some(predicate: (value: number, index: number, array: Float64Array) => unknown): boolean;
    sort(compareFn?: (a: number, b: number) => number): Float64Array;
    subarray(begin: number, end?: number): Float64Array;
    toString(): string;
    valueOf(): Float64Array;
  };
}
