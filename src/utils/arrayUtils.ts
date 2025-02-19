
/**
 * Utility functions for converting between Float64Array and number[] arrays
 */

/**
 * Converts a number[] to Float64Array
 * @param array Input number array
 * @returns Float64Array
 */
export function toFloat64Array(array: number[] | Float64Array): Float64Array {
  if (array instanceof Float64Array) {
    return array;
  }
  return new Float64Array(array);
}

/**
 * Converts a Float64Array to number[]
 * @param array Input Float64Array
 * @returns number[]
 */
export function toNumberArray(array: Float64Array | number[]): number[] {
  if (Array.isArray(array)) {
    return array;
  }
  return Array.from(array);
}

/**
 * Creates a new Float64Array filled with zeros
 * @param length Length of the array
 * @returns Float64Array filled with zeros
 */
export function createZeroFloat64Array(length: number): Float64Array {
  return new Float64Array(length);
}

/**
 * Safely converts any array-like input to Float64Array
 * @param input Input array-like object
 * @returns Float64Array
 */
export function safeFloat64Array(input: ArrayLike<number>): Float64Array {
  if (input instanceof Float64Array) {
    return input;
  }
  return new Float64Array(input);
}

/**
 * Concatenates multiple Float64Arrays into a single Float64Array
 * @param arrays Arrays to concatenate
 * @returns Concatenated Float64Array
 */
export function concatFloat64Arrays(...arrays: Float64Array[]): Float64Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Float64Array(totalLength);
  let offset = 0;
  
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  
  return result;
}

/**
 * Checks if two Float64Arrays are equal
 * @param a First array
 * @param b Second array
 * @returns boolean indicating if arrays are equal
 */
export function areFloat64ArraysEqual(a: Float64Array, b: Float64Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Creates a Float64Array from a subarray of a number[]
 * @param array Source array
 * @param start Start index
 * @param end End index
 * @returns Float64Array containing the specified slice
 */
export function float64ArrayFromSlice(array: number[] | Float64Array, start: number, end?: number): Float64Array {
  if (array instanceof Float64Array) {
    return array.slice(start, end);
  }
  return new Float64Array(array.slice(start, end));
}
