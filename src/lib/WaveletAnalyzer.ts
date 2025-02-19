
import { WaveletConfig, VitalReading, SpectralFeatures, WaveletDecomposition } from '@/types';

export class WaveletAnalyzer {
  private readonly config: WaveletConfig;
  private decompositionLevels: number = 8;
  
  private coefficients: Float32Array[];
  private energyMap: Float32Array[];
  private phaseMap: Float32Array[];
  
  private readonly motherWavelets: {[key: string]: (t: number, s: number) => number} = {
    morlet: (t: number, s: number) => this.morletWavelet(t, s),
    mexican_hat: (t: number, s: number) => this.mexicanHatWavelet(t, s)
  };

  constructor(config: WaveletConfig) {
    this.config = config;
    this.coefficients = [];
    this.energyMap = [];
    this.phaseMap = [];
    this.setupAnalysis();
  }

  private setupAnalysis(): void {
    this.coefficients = new Array(this.decompositionLevels).fill(null).map(() => new Float32Array(this.config.windowSize));
    this.energyMap = new Array(this.decompositionLevels).fill(null).map(() => new Float32Array(this.config.windowSize));
    this.phaseMap = new Array(this.decompositionLevels).fill(null).map(() => new Float32Array(this.config.windowSize));
  }

  public analyze(signal: Float32Array): WaveletDecomposition {
    const normalizedSignal = this.normalizeSignal(signal);
    const decomposition = this.performDecomposition(normalizedSignal);
    return decomposition;
  }

  private normalizeSignal(signal: Float32Array): Float32Array {
    const mean = signal.reduce((a, b) => a + b) / signal.length;
    const normalized = new Float32Array(signal.length);
    for (let i = 0; i < signal.length; i++) {
      normalized[i] = signal[i] - mean;
    }
    return normalized;
  }

  private performDecomposition(signal: Float32Array): WaveletDecomposition {
    const scales = this.generateScales();
    const decomposition: WaveletDecomposition = {
      coefficients: [],
      energies: [],
      phases: [],
      scales: scales
    };

    scales.forEach((scale, idx) => {
      const coeffs = this.computeWaveletTransform(signal, scale);
      const energy = this.computeEnergySpectrum(coeffs);
      const phase = this.computePhaseSpectrum(coeffs);
      
      decomposition.coefficients[idx] = coeffs;
      decomposition.energies[idx] = energy;
      decomposition.phases[idx] = phase;
    });

    return decomposition;
  }

  private generateScales(): number[] {
    const minScale = 2;
    const maxScale = this.config.windowSize / 4;
    const numScales = Math.ceil(Math.log2(maxScale / minScale));
    
    return Array.from({length: numScales}, (_, i) => {
      return minScale * Math.pow(2, i);
    });
  }

  private computeWaveletTransform(signal: Float32Array, scale: number): Float32Array {
    const output = new Float32Array(signal.length);
    const wavelet = this.config.waveletType === 'morlet' ? this.morletWavelet : this.mexicanHatWavelet;

    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      for (let j = 0; j < signal.length; j++) {
        const t = j - i;
        sum += signal[j] * wavelet.call(this, t, scale);
      }
      output[i] = sum;
    }

    return output;
  }

  private computeEnergySpectrum(coefficients: Float32Array): Float32Array {
    const energy = new Float32Array(coefficients.length);
    for (let i = 0; i < coefficients.length; i++) {
      energy[i] = coefficients[i] * coefficients[i];
    }
    return energy;
  }

  private computePhaseSpectrum(coefficients: Float32Array): Float32Array {
    const phase = new Float32Array(coefficients.length);
    for (let i = 0; i < coefficients.length; i++) {
      phase[i] = Math.atan2(Math.imag(coefficients[i]), Math.real(coefficients[i]));
    }
    return phase;
  }

  private morletWavelet(t: number, s: number): number {
    const omega0 = 6.0;
    const term1 = Math.exp(-t * t / (2 * s * s));
    const term2 = Math.cos(omega0 * t / s);
    const term3 = Math.exp(-omega0 * omega0 / 2);
    return (1 / Math.sqrt(s)) * (term1 * (term2 - term3));
  }

  private mexicanHatWavelet(t: number, s: number): number {
    const t2 = (t / s) * (t / s);
    return (1 / Math.sqrt(s)) * (1 - t2) * Math.exp(-t2 / 2);
  }

  public reset(): void {
    this.coefficients = [];
    this.energyMap = [];
    this.phaseMap = [];
    this.setupAnalysis();
  }
}
