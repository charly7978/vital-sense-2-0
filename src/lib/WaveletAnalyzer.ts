
import {
  WaveletAnalysis,
  WaveletCoefficients,
  WaveletTransform,
  WaveletBasis,
  WaveletPacket,
  ScaleSpace,
  SubbandFeatures,
  Float64Type,
  OptimizedDWT
} from '@/types';
import { toFloat64Array, createZeroFloat64Array } from '../utils/arrayUtils';

export class WaveletAnalyzer {
  private readonly wavelet: OptimizedDWT;
  private readonly config = {
    levels: 4,
    waveletType: 'db4',
    boundary: 'symmetric',
    thresholdRule: 'universal',
    thresholdType: 'soft',
    noiseEstimate: 'mad'
  };

  constructor() {
    this.wavelet = this.initializeWavelet();
  }

  public analyze(signal: Float64Type): WaveletAnalysis {
    try {
      // Transform signal
      const transform = this.wavelet.forward(toFloat64Array(signal));

      // Extract features from coefficients
      const features = this.extractFeatures(transform.coefficients);

      // Calculate subband features
      const subbands = this.analyzeSubbands(transform.coefficients);

      return {
        coefficients: transform.coefficients,
        features: subbands,
        levels: this.config.levels,
        bases: transform.bases,
        space: transform.space,
        dispose: () => {
          this.cleanup();
        }
      };

    } catch (error) {
      console.error('Wavelet analysis error:', error);
      throw error;
    }
  }

  private initializeWavelet(): OptimizedDWT {
    return {
      forward: (signal: Float64Type): WaveletTransform => {
        const coefficients = this.decompose(signal);
        const bases = this.generateBases(coefficients);
        const space = this.computeScaleSpace(coefficients);

        return {
          coefficients,
          bases,
          space
        };
      },
      inverse: (transform: WaveletTransform): Float64Type => {
        return this.reconstruct(transform.coefficients);
      }
    };
  }

  private decompose(signal: Float64Type): WaveletCoefficients {
    const N = signal.length;
    const levels = Math.min(this.config.levels, Math.floor(Math.log2(N)));
    
    const approximation = toFloat64Array(signal);
    const details: Float64Type[] = new Array(levels);
    
    for (let i = 0; i < levels; i++) {
      const { cA, cD } = this.decomposeLevel(approximation);
      details[i] = cD;
      approximation.set(cA);
    }

    return { approximation, details };
  }

  private decomposeLevel(signal: Float64Type): { cA: Float64Type; cD: Float64Type } {
    const N = signal.length;
    const half = Math.ceil(N / 2);
    
    const cA = createZeroFloat64Array(half);
    const cD = createZeroFloat64Array(half);
    
    for (let i = 0; i < half; i++) {
      const k = i * 2;
      if (k + 1 < N) {
        cA[i] = (signal[k] + signal[k + 1]) / Math.sqrt(2);
        cD[i] = (signal[k] - signal[k + 1]) / Math.sqrt(2);
      } else {
        cA[i] = signal[k] / Math.sqrt(2);
        cD[i] = signal[k] / Math.sqrt(2);
      }
    }
    
    return { cA, cD };
  }

  private reconstruct(coefficients: WaveletCoefficients): Float64Type {
    const { approximation, details } = coefficients;
    let current = approximation;

    for (let i = details.length - 1; i >= 0; i--) {
      current = this.reconstructLevel(current, details[i]);
    }

    return current;
  }

  private reconstructLevel(cA: Float64Type, cD: Float64Type): Float64Type {
    const N = (cA.length + cD.length) * 2;
    const reconstructed = createZeroFloat64Array(N);

    for (let i = 0; i < cA.length; i++) {
      const k = i * 2;
      reconstructed[k] = (cA[i] + cD[i]) / Math.sqrt(2);
      if (k + 1 < N) {
        reconstructed[k + 1] = (cA[i] - cD[i]) / Math.sqrt(2);
      }
    }

    return reconstructed;
  }

  private generateBases(coefficients: WaveletCoefficients): WaveletBasis[] {
    const bases: WaveletBasis[] = [];
    const { details } = coefficients;
    
    for (let level = 0; level < details.length; level++) {
      const scale = Math.pow(2, level + 1);
      const coeffs = details[level];
      
      for (let k = 0; k < coeffs.length; k++) {
        bases.push({
          scale,
          translation: k * scale,
          coefficients: createZeroFloat64Array(coeffs.length)
        });
      }
    }
    
    return bases;
  }

  private computeScaleSpace(coefficients: WaveletCoefficients): ScaleSpace {
    const { details } = coefficients;
    const scales = new Float64Array(details.length);
    const energies = new Float64Array(details.length);
    
    for (let i = 0; i < details.length; i++) {
      scales[i] = Math.pow(2, i + 1);
      energies[i] = details[i].reduce((sum, val) => sum + val * val, 0);
    }
    
    return {
      scales,
      coefficients: details,
      energies
    };
  }

  private extractFeatures(coefficients: WaveletCoefficients): SubbandFeatures {
    const { approximation, details } = coefficients;
    const N = details.length + 1;
    
    const energy = new Float64Array(N);
    const entropy = new Float64Array(N);
    const variance = new Float64Array(N);
    
    // Calculate features for approximation coefficients
    energy[0] = this.calculateEnergy(approximation);
    entropy[0] = this.calculateEntropy(approximation);
    variance[0] = this.calculateVariance(approximation);
    
    // Calculate features for detail coefficients
    for (let i = 0; i < details.length; i++) {
      energy[i + 1] = this.calculateEnergy(details[i]);
      entropy[i + 1] = this.calculateEntropy(details[i]);
      variance[i + 1] = this.calculateVariance(details[i]);
    }
    
    return { energy, entropy, variance };
  }

  private calculateEnergy(coeffs: Float64Type): number {
    return coeffs.reduce((sum, val) => sum + val * val, 0);
  }

  private calculateEntropy(coeffs: Float64Type): number {
    const pdf = this.calculateProbabilityDensity(coeffs);
    return -pdf.reduce((sum, p) => sum + (p > 0 ? p * Math.log2(p) : 0), 0);
  }

  private calculateVariance(coeffs: Float64Type): number {
    const mean = coeffs.reduce((sum, val) => sum + val, 0) / coeffs.length;
    return coeffs.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / coeffs.length;
  }

  private calculateProbabilityDensity(coeffs: Float64Type): Float64Type {
    const histogram = new Float64Array(10); // Use 10 bins
    const min = Math.min(...coeffs);
    const max = Math.max(...coeffs);
    const range = max - min;
    const binWidth = range / histogram.length;

    // Fill histogram
    coeffs.forEach(val => {
      const bin = Math.min(
        Math.floor((val - min) / binWidth),
        histogram.length - 1
      );
      histogram[bin]++;
    });

    // Normalize to get probability density
    const sum = histogram.reduce((a, b) => a + b, 0);
    return histogram.map(count => count / sum) as Float64Type;
  }

  private cleanup(): void {
    // Clean up any resources
  }
}
