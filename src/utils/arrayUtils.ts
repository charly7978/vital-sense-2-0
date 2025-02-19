
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

// Window Functions

/**
 * Applies Hanning window to the signal
 * @param array Input signal
 * @returns Windowed signal
 */
export function applyHanningWindow(array: Float64Array): Float64Array {
  const N = array.length;
  const result = new Float64Array(N);
  
  for (let i = 0; i < N; i++) {
    const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
    result[i] = array[i] * window;
  }
  
  return result;
}

/**
 * Applies Hamming window to the signal
 * @param array Input signal
 * @returns Windowed signal
 */
export function applyHammingWindow(array: Float64Array): Float64Array {
  const N = array.length;
  const result = new Float64Array(N);
  
  for (let i = 0; i < N; i++) {
    const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
    result[i] = array[i] * window;
  }
  
  return result;
}

/**
 * Applies Blackman window to the signal
 * @param array Input signal
 * @returns Windowed signal
 */
export function applyBlackmanWindow(array: Float64Array): Float64Array {
  const N = array.length;
  const result = new Float64Array(N);
  
  for (let i = 0; i < N; i++) {
    const window = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)) + 
                  0.08 * Math.cos((4 * Math.PI * i) / (N - 1));
    result[i] = array[i] * window;
  }
  
  return result;
}

// Statistical Functions

/**
 * Calculates the mean of a Float64Array
 * @param array Input array
 * @returns Mean value
 */
export function calculateMean(array: Float64Array): number {
  return array.reduce((sum, val) => sum + val, 0) / array.length;
}

/**
 * Calculates the variance of a Float64Array
 * @param array Input array
 * @param mean Optional pre-calculated mean
 * @returns Variance value
 */
export function calculateVariance(array: Float64Array, mean?: number): number {
  const arrayMean = mean ?? calculateMean(array);
  return array.reduce((sum, val) => sum + Math.pow(val - arrayMean, 2), 0) / array.length;
}

/**
 * Calculates the standard deviation of a Float64Array
 * @param array Input array
 * @param mean Optional pre-calculated mean
 * @returns Standard deviation value
 */
export function calculateStandardDeviation(array: Float64Array, mean?: number): number {
  return Math.sqrt(calculateVariance(array, mean));
}

/**
 * Calculates the median of a Float64Array
 * @param array Input array
 * @returns Median value
 */
export function calculateMedian(array: Float64Array): number {
  const sorted = Float64Array.from(array).sort();
  const middle = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  
  return sorted[middle];
}

/**
 * Calculates the skewness of a Float64Array
 * @param array Input array
 * @returns Skewness value
 */
export function calculateSkewness(array: Float64Array): number {
  const mean = calculateMean(array);
  const std = calculateStandardDeviation(array, mean);
  const n = array.length;
  
  return array.reduce((sum, val) => 
    sum + Math.pow((val - mean) / std, 3), 0) / n;
}

/**
 * Calculates the kurtosis of a Float64Array
 * @param array Input array
 * @returns Kurtosis value
 */
export function calculateKurtosis(array: Float64Array): number {
  const mean = calculateMean(array);
  const std = calculateStandardDeviation(array, mean);
  const n = array.length;
  
  return array.reduce((sum, val) => 
    sum + Math.pow((val - mean) / std, 4), 0) / n - 3;
}

// Signal Processing Functions

/**
 * Normalizes a Float64Array to have zero mean and unit variance
 * @param array Input array
 * @returns Normalized array
 */
export function normalizeSignal(array: Float64Array): Float64Array {
  const mean = calculateMean(array);
  const std = calculateStandardDeviation(array, mean);
  
  return new Float64Array(array.map(x => (x - mean) / std));
}

/**
 * Segments a signal into windows of specified size
 * @param array Input array
 * @param windowSize Size of each window
 * @param overlap Overlap between windows (0-1)
 * @returns Array of windowed segments
 */
export function segmentSignal(
  array: Float64Array, 
  windowSize: number, 
  overlap: number = 0
): Float64Array[] {
  const step = Math.floor(windowSize * (1 - overlap));
  const numWindows = Math.floor((array.length - windowSize) / step) + 1;
  const windows: Float64Array[] = [];
  
  for (let i = 0; i < numWindows; i++) {
    const start = i * step;
    const window = array.slice(start, start + windowSize);
    windows.push(window);
  }
  
  return windows;
}

/**
 * Creates a zero-filled Float64Array
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
 * Concatenates multiple Float64Arrays
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
 * Creates a Float64Array from a slice of another array
 * @param array Source array
 * @param start Start index
 * @param end End index
 * @returns Float64Array containing the specified slice
 */
export function float64ArrayFromSlice(
  array: number[] | Float64Array,
  start: number,
  end?: number
): Float64Array {
  if (array instanceof Float64Array) {
    return array.slice(start, end);
  }
  return new Float64Array(array.slice(start, end));
}

