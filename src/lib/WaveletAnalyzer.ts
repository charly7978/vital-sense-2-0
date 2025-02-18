// src/lib/WaveletAnalyzer.ts

import { SensitivitySettings } from '@/types';

export class WaveletAnalyzer {
  // Configuración de wavelets
  private readonly motherWavelet = {
    name: 'db4', // Daubechies 4
    coefficients: [
      0.1629, 0.5055, 0.4461, -0.0198,
      -0.1323, 0.0218, 0.0233, -0.0075
    ]
  };

  // Configuración de análisis
  private readonly config = {
    maxLevel: 5,
    minFrequency: 0.5,  // Hz
    maxFrequency: 4.0,  // Hz
    windowSize: 256,
    overlapSize: 128
  };

  // Buffers y estado
  private readonly signalBuffer: Float32Array;
  private readonly peakBuffer: number[] = [];
  private readonly frequencyBands: Float32Array[];
  private lastPeakTime = 0;
  private baselineAmplitude = 1.0;

  constructor(
    private readonly sampleRate: number,
    private settings: SensitivitySettings
  ) {
    this.signalBuffer = new Float32Array(this.config.windowSize);
    this.frequencyBands = Array(this.config.maxLevel)
      .fill(0)
      .map(() => new Float32Array(this.config.windowSize));
    this.initializeWaveletBanks();
  }

  public analyze(signal: Float32Array): {
    isPeak: boolean;
    frequency: number;
    amplitude: number;
    quality: number;
    features: {
      entropy: number;
      energy: number[];
      dominantFrequency: number;
      harmonicRatio: number;
      waveformComplexity: number;
    };
  } {
    // Actualizar buffer circular
    this.updateBuffer(signal);

    // Descomposición wavelet
    const coefficients = this.waveletDecomposition(this.signalBuffer);

    // Análisis de componentes de frecuencia
    const frequencyComponents = this.analyzeFrequencyComponents(coefficients);

    // Detección de picos adaptativa
    const peakInfo = this.detectPeaks(frequencyComponents);

    // Análisis de características de la señal
    const features = this.extractFeatures(coefficients, frequencyComponents);

    // Calcular calidad de la señal
    const quality = this.calculateSignalQuality(features);

    return {
      isPeak: peakInfo.isPeak,
      frequency: peakInfo.frequency,
      amplitude: peakInfo.amplitude,
      quality,
      features
    };
  }

  private updateBuffer(newData: Float32Array): void {
    // Desplazar datos existentes
    this.signalBuffer.set(
      this.signalBuffer.subarray(newData.length),
      0
    );
    // Añadir nuevos datos
    this.signalBuffer.set(
      newData,
      this.signalBuffer.length - newData.length
    );
  }

  private waveletDecomposition(signal: Float32Array): Float32Array[] {
    const coefficients: Float32Array[] = [];
    let currentSignal = new Float32Array(signal);

    for (let level = 0; level < this.config.maxLevel; level++) {
      const { approximation, detail } = this.singleLevelDWT(currentSignal);
      coefficients.unshift(detail);
      currentSignal = approximation;
    }

    coefficients.unshift(currentSignal);
    return coefficients;
  }

  private singleLevelDWT(signal: Float32Array): {
    approximation: Float32Array;
    detail: Float32Array;
  } {
    const len = signal.length;
    const halfLen = Math.floor(len / 2);
    const approximation = new Float32Array(halfLen);
    const detail = new Float32Array(halfLen);

    for (let i = 0; i < halfLen; i++) {
      let sumApprox = 0;
      let sumDetail = 0;
      for (let j = 0; j < this.motherWavelet.coefficients.length; j++) {
        const idx = 2 * i + j;
        if (idx < len) {
          const coeff = this.motherWavelet.coefficients[j];
          sumApprox += signal[idx] * coeff;
          sumDetail += signal[idx] * (j % 2 === 0 ? coeff : -coeff);
        }
      }
      approximation[i] = sumApprox;
      detail[i] = sumDetail;
    }

    return { approximation, detail };
  }

  private analyzeFrequencyComponents(coefficients: Float32Array[]): {
    bands: number[];
    phases: number[];
    coherence: number;
  } {
    const bands: number[] = [];
    const phases: number[] = [];
    let totalEnergy = 0;

    // Análisis por banda de frecuencia
    coefficients.forEach((band, i) => {
      const { energy, phase } = this.analyzeFrequencyBand(band, i);
      bands.push(energy);
      phases.push(phase);
      totalEnergy += energy;
    });

    // Normalizar energías
    const normalizedBands = bands.map(e => e / totalEnergy);

    // Calcular coherencia entre bandas
    const coherence = this.calculateCoherence(phases);

    return {
      bands: normalizedBands,
      phases,
      coherence
    };
  }

  private analyzeFrequencyBand(
    band: Float32Array,
    level: number
  ): { energy: number; phase: number } {
    let energy = 0;
    let sumReal = 0;
    let sumImag = 0;

    for (let i = 0; i < band.length; i++) {
      energy += band[i] * band[i];
      
      // Análisis de fase usando transformada de Hilbert simplificada
      const hilbertPhase = Math.PI * (i / band.length);
      sumReal += band[i] * Math.cos(hilbertPhase);
      sumImag += band[i] * Math.sin(hilbertPhase);
    }

    const phase = Math.atan2(sumImag, sumReal);
    return { energy, phase };
  }

  private detectPeaks(
    frequencyComponents: { bands: number[]; coherence: number }
  ): { isPeak: boolean; frequency: number; amplitude: number } {
    const now = Date.now();
    const dominantBand = this.findDominantBand(frequencyComponents.bands);
    const instantFrequency = this.bandToFrequency(dominantBand);
    
    // Calcular amplitud normalizada
    const amplitude = Math.sqrt(frequencyComponents.bands[dominantBand]);
    
    // Actualizar línea base adaptativa
    this.updateBaseline(amplitude);

    // Detección de picos adaptativa
    const isPeak = this.isPeakDetected(
      amplitude,
      instantFrequency,
      frequencyComponents.coherence,
      now
    );

    return {
      isPeak,
      frequency: instantFrequency,
      amplitude: amplitude / this.baselineAmplitude
    };
  }

  private findDominantBand(bands: number[]): number {
    let maxEnergy = 0;
    let dominantBand = 0;

    bands.forEach((energy, i) => {
      const frequency = this.bandToFrequency(i);
      if (
        energy > maxEnergy &&
        frequency >= this.config.minFrequency &&
        frequency <= this.config.maxFrequency
      ) {
        maxEnergy = energy;
        dominantBand = i;
      }
    });

    return dominantBand;
  }

  private bandToFrequency(band: number): number {
    return (this.sampleRate / 2) / Math.pow(2, band + 1);
  }

  private updateBaseline(amplitude: number): void {
    const alpha = 0.05; // Factor de adaptación
    this.baselineAmplitude = (1 - alpha) * this.baselineAmplitude + 
                            alpha * amplitude;
  }

  private isPeakDetected(
    amplitude: number,
    frequency: number,
    coherence: number,
    timestamp: number
  ): boolean {
    // Período esperado basado en la frecuencia
    const expectedPeriod = 1000 / frequency;
    
    // Tiempo desde el último pico
    const timeSinceLastPeak = timestamp - this.lastPeakTime;

    // Umbral adaptativo
    const threshold = this.baselineAmplitude * 
                     this.settings.heartbeatThreshold * 
                     (1 + 0.2 * coherence);

    if (
      amplitude > threshold &&
      timeSinceLastPeak > expectedPeriod * 0.7 &&
      timeSinceLastPeak < expectedPeriod * 1.3
    ) {
      this.lastPeakTime = timestamp;
      return true;
    }

    return false;
  }

  private extractFeatures(
    coefficients: Float32Array[],
    frequencyComponents: { bands: number[]; coherence: number }
  ): {
    entropy: number;
    energy: number[];
    dominantFrequency: number;
    harmonicRatio: number;
    waveformComplexity: number;
  } {
    // Entropía wavelet
    const entropy = this.calculateWaveletEntropy(coefficients);

    // Energía por banda
    const energy = frequencyComponents.bands;

    // Frecuencia dominante
    const dominantBand = this.findDominantBand(energy);
    const dominantFrequency = this.bandToFrequency(dominantBand);

    // Ratio armónico
    const harmonicRatio = this.calculateHarmonicRatio(energy, dominantBand);

    // Complejidad de la forma de onda
    const waveformComplexity = this.calculateWaveformComplexity(coefficients);

    return {
      entropy,
      energy,
      dominantFrequency,
      harmonicRatio,
      waveformComplexity
    };
  }

  private calculateWaveletEntropy(coefficients: Float32Array[]): number {
    let totalEnergy = 0;
    const energies: number[] = [];

    coefficients.forEach(band => {
      const energy = band.reduce((sum, c) => sum + c * c, 0);
      energies.push(energy);
      totalEnergy += energy;
    });

    if (totalEnergy === 0) return 0;

    return -energies.reduce((entropy, energy) => {
      const p = energy / totalEnergy;
      return entropy + (p > 0 ? p * Math.log2(p) : 0);
    }, 0);
  }

  private calculateHarmonicRatio(
    energy: number[],
    dominantBand: number
  ): number {
    const fundamentalEnergy = energy[dominantBand];
    const harmonicEnergy = energy
      .filter((_, i) => i !== dominantBand)
      .reduce((sum, e) => sum + e, 0);

    return fundamentalEnergy / (harmonicEnergy + 1e-6);
  }

  private calculateWaveformComplexity(coefficients: Float32Array[]): number {
    let complexity = 0;
    
    coefficients.forEach(band => {
      let changes = 0;
      for (let i = 1; i < band.length; i++) {
        if (Math.sign(band[i]) !== Math.sign(band[i-1])) {
          changes++;
        }
      }
      complexity += changes / band.length;
    });

    return complexity / coefficients.length;
  }

  private calculateCoherence(phases: number[]): number {
    let sumSin = 0;
    let sumCos = 0;

    phases.forEach(phase => {
      sumSin += Math.sin(phase);
      sumCos += Math.cos(phase);
    });

    const n = phases.length;
    return Math.sqrt(sumSin*sumSin + sumCos*sumCos) / n;
  }

  private calculateSignalQuality(features: {
    entropy: number;
    harmonicRatio: number;
    waveformComplexity: number;
  }): number {
    // Pesos para diferentes características
    const weights = {
      entropy: 0.3,
      harmonicRatio: 0.4,
      complexity: 0.3
    };

    // Normalizar y combinar características
    const normalizedEntropy = 1 - features.entropy / 5; // Máxima entropía esperada
    const normalizedHarmonicRatio = Math.min(1, features.harmonicRatio / 3);
    const normalizedComplexity = 1 - features.waveformComplexity;

    return weights.entropy * normalizedEntropy +
           weights.harmonicRatio * normalizedHarmonicRatio +
           weights.complexity * normalizedComplexity;
  }

  public updateSettings(settings: SensitivitySettings): void {
    this.settings = settings;
  }

  private initializeWaveletBanks(): void {
    // Precalcular bancos de filtros wavelet para cada nivel
    // Esto mejora el rendimiento evitando cálculos repetitivos
    // ... (implementación de inicialización de bancos de filtros)
  }

  public getPeakToPeakInterval(signal: Float32Array): number {
    const peaks = this.findAllPeaks(signal);
    if (peaks.length < 2) return 0;

    let totalInterval = 0;
    for (let i = 1; i < peaks.length; i++) {
      totalInterval += peaks[i] - peaks[i-1];
    }

    return totalInterval / (peaks.length - 1);
  }

  private findAllPeaks(signal: Float32Array): number[] {
    const peaks: number[] = [];
    const minPeakDistance = Math.floor(this.sampleRate * 0.3); // 300ms

    for (let i = 1; i < signal.length - 1; i++) {
      if (
        signal[i] > signal[i-1] &&
        signal[i] > signal[i+1] &&
        (peaks.length === 0 || i - peaks[peaks.length-1] >= minPeakDistance)
      ) {
        peaks.push(i);
      }
    }

    return peaks;
  }
}
