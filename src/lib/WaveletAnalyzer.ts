
import { WaveletConfig, VitalReading, Percent, createPercent } from '@/types';

export class WaveletAnalyzer {
  private config: WaveletConfig;
  private buffer: Float32Array;
  private waveletCoefficients: Float32Array[];
  private lastAnalysis: {
    timestamp: number;
    peaks: number[];
    frequencies: number[];
    energy: number[];
  };

  constructor() {
    this.config = {
      samplingRate: 30,
      windowSize: 256,
      scales: [2, 4, 8, 16, 32],
      waveletType: 'morlet'
    };

    this.buffer = new Float32Array(this.config.windowSize);
    this.waveletCoefficients = this.initializeWavelets();
    this.lastAnalysis = {
      timestamp: 0,
      peaks: [],
      frequencies: [],
      energy: []
    };
  }

  public initialize(config: Partial<WaveletConfig>): void {
    this.config = { ...this.config, ...config };
    this.buffer = new Float32Array(this.config.windowSize);
    this.waveletCoefficients = this.initializeWavelets();
    this.reset();
  }

  public analyze(signal: number): VitalReading[] {
    // Actualizar buffer
    this.buffer.copyWithin(0, 1);
    this.buffer[this.buffer.length - 1] = signal;

    // Realizar transformada wavelet
    const coefficients = this.computeWaveletTransform();
    
    // Detectar picos y frecuencias
    const peaks = this.detectPeaks(coefficients);
    const frequencies = this.estimateFrequencies(coefficients);
    const energy = this.computeEnergy(coefficients);

    // Actualizar último análisis
    this.lastAnalysis = {
      timestamp: Date.now(),
      peaks,
      frequencies,
      energy
    };

    // Generar lecturas vitales
    return this.generateReadings();
  }

  public reset(): void {
    this.buffer.fill(0);
    this.lastAnalysis = {
      timestamp: 0,
      peaks: [],
      frequencies: [],
      energy: []
    };
  }

  private initializeWavelets(): Float32Array[] {
    return this.config.scales.map(scale => {
      const wavelet = new Float32Array(this.config.windowSize);
      
      // Generar coeficientes wavelet según el tipo
      if (this.config.waveletType === 'morlet') {
        this.generateMorletWavelet(wavelet, scale);
      } else {
        this.generateMexicanHatWavelet(wavelet, scale);
      }

      return wavelet;
    });
  }

  private generateMorletWavelet(wavelet: Float32Array, scale: number): void {
    const omega0 = 6.0; // Frecuencia central
    const factor = Math.sqrt(1.0 / scale);

    for (let i = 0; i < wavelet.length; i++) {
      const t = (i - wavelet.length / 2) / scale;
      const gaussian = Math.exp(-t * t / 2);
      const cosine = Math.cos(omega0 * t);
      wavelet[i] = factor * gaussian * cosine;
    }
  }

  private generateMexicanHatWavelet(wavelet: Float32Array, scale: number): void {
    const factor = Math.sqrt(2.0 / (3.0 * scale));

    for (let i = 0; i < wavelet.length; i++) {
      const t = (i - wavelet.length / 2) / scale;
      const t2 = t * t;
      wavelet[i] = factor * (1 - t2) * Math.exp(-t2 / 2);
    }
  }

  private computeWaveletTransform(): Float32Array[] {
    return this.waveletCoefficients.map(wavelet => {
      const coefficients = new Float32Array(this.config.windowSize);
      
      // Convolución con el buffer
      for (let i = 0; i < this.config.windowSize; i++) {
        let sum = 0;
        for (let j = 0; j < this.config.windowSize; j++) {
          const idx = (i + j) % this.config.windowSize;
          sum += this.buffer[j] * wavelet[idx];
        }
        coefficients[i] = sum;
      }

      return coefficients;
    });
  }

  private detectPeaks(coefficients: Float32Array[]): number[] {
    const peaks: number[] = [];
    const threshold = this.computeThreshold(coefficients);

    coefficients.forEach(scale => {
      for (let i = 1; i < scale.length - 1; i++) {
        if (scale[i] > threshold &&
            scale[i] > scale[i - 1] &&
            scale[i] > scale[i + 1]) {
          peaks.push(i);
        }
      }
    });

    return peaks;
  }

  private estimateFrequencies(coefficients: Float32Array[]): number[] {
    return this.config.scales.map((scale, idx) => {
      const energy = this.computeScaleEnergy(coefficients[idx]);
      return (this.config.samplingRate / scale) * energy;
    });
  }

  private computeEnergy(coefficients: Float32Array[]): number[] {
    return coefficients.map(scale => {
      let energy = 0;
      for (let i = 0; i < scale.length; i++) {
        energy += scale[i] * scale[i];
      }
      return Math.sqrt(energy / scale.length);
    });
  }

  private computeThreshold(coefficients: Float32Array[]): number {
    let max = 0;
    coefficients.forEach(scale => {
      const scaleMax = Math.max(...Array.from(scale));
      max = Math.max(max, scaleMax);
    });
    return max * 0.3; // 30% del máximo como umbral
  }

  private computeScaleEnergy(scale: Float32Array): number {
    let energy = 0;
    for (let i = 0; i < scale.length; i++) {
      energy += scale[i] * scale[i];
    }
    return Math.sqrt(energy / scale.length);
  }

  private generateReadings(): VitalReading[] {
    return this.lastAnalysis.frequencies.map((freq, idx) => ({
      timestamp: this.lastAnalysis.timestamp,
      value: freq,
      quality: createPercent(this.lastAnalysis.energy[idx] / Math.max(...this.lastAnalysis.energy) * 100)
    }));
  }

  public getConfig(): WaveletConfig {
    return { ...this.config };
  }

  public getLastAnalysis() {
    return { ...this.lastAnalysis };
  }
}
