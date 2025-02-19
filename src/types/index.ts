
// Re-export all types
export * from './common';
export * from './analysis';
export * from './config';
export * from './quality';

// External type augmentations
declare global {
  interface Window {
    Float64Array: Float64ArrayConstructor;
  }
}
