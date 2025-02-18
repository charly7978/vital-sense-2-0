// src/lib/SignalQualityAnalyzer.ts

import { SignalQualityLevel, SensitivitySettings } from '@/types';

export class SignalQualityAnalyzer {
  // Configuración de análisis
  private readonly config = {
    windowSize: 256,
    minSNR: 5.0,        // dB
    maxMotion: 0.3,     // Umbral de movimiento
    minBrightness: 0.2,
    maxBrightness: 0.9,
    minContrast: 0.15,
    minStability: 0.7,
    sampleRate: 30,     // Hz
    
    // Pesos para métricas de calidad
    weights: {
      snr: 0.25,
      stability: 0.20,
      motion: 0.15,
      brightness: 0.15,
      contrast: 0.15,
      frequency: 0.10
    },

    // Umbrales de calidad
    thresholds: {
      excellent: 0.85,
      good: 0.70,
      fair: 0.50,
      poor: 0.30
    }
  };

  // Buffers y estado
  private readonly signalBuffer: Float32Array;
  private readonly qualityHistory: number[] = [];
  private readonly motionHistory: number[] = [];
  private readonly frequencyHistory: number[] = [];
  private readonly maxHistoryLength = 90; // 3 segundos @ 30Hz

  // Análisis espectral
  private readonly fftSize = 256;
  private readonly hannWindow: Float32Array;
  private readonly fft: FFTAnalyzer;

  constructor(private settings: SensitivitySettings) {
    this.signalBuffer = new Float32Array(this.config.windowSize);
    this.hannWindow = this.createHannWindow();
    this.fft = new FFTAnalyzer(this.fftSize);
    this.initializeAnalyzer();
  }

  public analyzeQuality(signal: Float32Array): SignalQualityLevel {
    // Actualizar buffer
    this.updateBuffer(signal);

    // Análisis completo
    const metrics = this.calculateMetrics();
    
    // Calcular score de calidad
    const qualityScore = this.calculateQualityScore(metrics);
    
    // Actualizar historiales
    this.updateHistories(metrics, qualityScore);
    
    // Determinar nivel de calidad
    return this.determineQualityLevel(qualityScore);
  }

  private calculateMetrics(): {
    snr: number;
    stability: number;
    motion: number;
    brightness: number;
    contrast: number;
    frequency: number;
    entropy: number;
    harmonics: number[];
  } {
    // Preparar señal para análisis
    const windowedSignal = this.applyWindow(this.signalBuffer);
    
    // Análisis espectral
    const spectrum = this.fft.forward(windowedSignal);
    const harmonics = this.analyzeHarmonics(spectrum);
    
    // Calcular métricas individuales
    return {
      snr: this.calculateSNR(windowedSignal, spectrum),
      stability: this.calculateStability(windowedSignal),
      motion: this.calculateMotion(),
      brightness: this.calculateBrightness(windowedSignal),
      contrast: this.calculateContrast(windowedSignal),
      frequency: this.estimateFrequency(spectrum),
      entropy: this.calculateSpectralEntropy(spectrum),
      harmonics
    };
  }

  private calculateSNR(signal: Float32Array, spectrum: Float32Array): number {
    const signalBand = this.extractSignalBand(spectrum);
    const noiseBand = this.extractNoiseBand(spectrum);
    
    const signalPower = signalBand.reduce((sum, val) => sum + val * val, 0);
    const noisePower = noiseBand.reduce((sum, val) => sum + val * val, 0);
    
    return noisePower === 0 ? 
      Number.POSITIVE_INFINITY : 
      10 * Math.log10(signalPower / noisePower);
  }

  private calculateStability(signal: Float32Array): number {
    if (this.qualityHistory.length < 2) return 1;

    const variations = this.qualityHistory
      .slice(-10)
      .map((q, i, arr) => i > 0 ? Math.abs(q - arr[i-1]) : 0);
    
    const avgVariation = variations.reduce((sum, v) => sum + v, 0) / variations.length;
    return Math.exp(-avgVariation * 5);
  }

  private calculateMotion(): number {
    if (this.motionHistory.length < 2) return 0;

    const recentMotion = this.motionHistory.slice(-5);
    return recentMotion.reduce((sum, m) => sum + m, 0) / recentMotion.length;
  }

  private calculateBrightness(signal: Float32Array): number {
    const mean = signal.reduce((sum, val) => sum + val, 0) / signal.length;
    return (mean + 1) / 2; // Normalizar a [0,1]
  }

  private calculateContrast(signal: Float32Array): number {
    let min = Infinity;
    let max = -Infinity;
    
    for (const value of signal) {
      min = Math.min(min, value);
      max = Math.max(max, value);
    }
    
    return max - min;
  }

  private estimateFrequency(spectrum: Float32Array): number {
    const peakBin = this.findPeakFrequencyBin(spectrum);
    return (peakBin * this.config.sampleRate) / this.fftSize;
  }

  private calculateSpectralEntropy(spectrum: Float32Array): number {
    const totalPower = spectrum.reduce((sum, val) => sum + val * val, 0);
    if (totalPower === 0) return 0;

    let entropy = 0;
    for (const val of spectrum) {
      const p = (val * val) / totalPower;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    return entropy / Math.log2(spectrum.length);
  }

  private analyzeHarmonics(spectrum: Float32Array): number[] {
    const fundamentalBin = this.findPeakFrequencyBin(spectrum);
    const harmonics: number[] = [];

    for (let i = 1; i <= 4; i++) {
      const harmonicBin = fundamentalBin * i;
      if (harmonicBin < spectrum.length) {
        const harmonicPower = this.calculateBandPower(
          spectrum,
          harmonicBin - 1,
          harmonicBin + 1
        );
        harmonics.push(harmonicPower);
      }
    }

    return harmonics;
  }

  private calculateQualityScore(metrics: {
    snr: number;
    stability: number;
    motion: number;
    brightness: number;
    contrast: number;
    frequency: number;
  }): number {
    // Normalizar métricas
    const normalizedSNR = Math.min(1, metrics.snr / this.config.minSNR);
    const normalizedMotion = 1 - Math.min(1, metrics.motion / this.config.maxMotion);
    const normalizedBrightness = this.normalizeBrightness(metrics.brightness);
    const normalizedContrast = Math.min(1, metrics.contrast / this.config.minContrast);
    const normalizedFrequency = this.normalizeFrequency(metrics.frequency);

    // Aplicar pesos
    return (
      this.config.weights.snr * normalizedSNR +
      this.config.weights.stability * metrics.stability +
      this.config.weights.motion * normalizedMotion +
      this.config.weights.brightness * normalizedBrightness +
      this.config.weights.contrast * normalizedContrast +
      this.config.weights.frequency * normalizedFrequency
    );
  }

  private determineQualityLevel(score: number): SignalQualityLevel {
    if (score >= this.config.thresholds.excellent)
      return SignalQualityLevel.Excellent;
    if (score >= this.config.thresholds.good)
      return SignalQualityLevel.Good;
    if (score >= this.config.thresholds.fair)
      return SignalQualityLevel.Fair;
    if (score >= this.config.thresholds.poor)
      return SignalQualityLevel.Poor;
    return SignalQualityLevel.Invalid;
  }

  // Métodos auxiliares
  private createHannWindow(): Float32Array {
    const window = new Float32Array(this.config.windowSize);
    for (let i = 0; i < this.config.windowSize; i++) {
      window[i] = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (this.config.windowSize - 1)));
    }
    return window;
  }

  private applyWindow(signal: Float32Array): Float32Array {
    const windowed = new Float32Array(signal.length);
    for (let i = 0; i < signal.length; i++) {
      windowed[i] = signal[i] * this.hannWindow[i];
    }
    return windowed;
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

  private updateHistories(
    metrics: {
      motion: number;
      frequency: number;
    },
    quality: number
  ): void {
    // Actualizar historiales
    this.qualityHistory.push(quality);
    this.motionHistory.push(metrics.motion);
    this.frequencyHistory.push(metrics.frequency);

    // Mantener longitud máxima
    if (this.qualityHistory.length > this.maxHistoryLength) {
      this.qualityHistory.shift();
      this.motionHistory.shift();
      this.frequencyHistory.shift();
    }
  }

  private normalizeBrightness(brightness: number): number {
    if (brightness < this.config.minBrightness) {
      return brightness / this.config.minBrightness;
    }
    if (brightness > this.config.maxBrightness) {
      return 1 - (brightness - this.config.maxBrightness) / 
                 (1 - this.config.maxBrightness);
    }
    return 1;
  }

  private normalizeFrequency(frequency: number): number {
    // Rango esperado: 0.5-4.0 Hz (30-240 BPM)
    const minFreq = 0.5;
    const maxFreq = 4.0;
    const normalizedFreq = (frequency - minFreq) / (maxFreq - minFreq);
    return Math.max(0, Math.min(1, normalizedFreq));
  }

  public updateSettings(newSettings: SensitivitySettings): void {
    this.settings = newSettings;
    this.updateConfigurationThresholds();
  }

  private updateConfigurationThresholds(): void {
    // Ajustar umbrales basados en la sensibilidad
    this.config.minSNR *= this.settings.signalAmplification;
    this.config.maxMotion *= (2 - this.settings.noiseReduction);
    this.config.minContrast *= this.settings.signalStability;
  }
}

// Clase auxiliar para análisis FFT
class FFTAnalyzer {
  private readonly size: number;
  private readonly real: Float32Array;
  private readonly imag: Float32Array;
  private readonly sinTable: Float32Array;
  private readonly cosTable: Float32Array;

  constructor(size: number) {
    this.size = size;
    this.real = new Float32Array(size);
    this.imag = new Float32Array(size);
    this.sinTable = new Float32Array(size);
    this.cosTable = new Float32Array(size);
    this.initializeTables();
  }

  private initializeTables(): void {
    for (let i = 0; i < this.size; i++) {
      const angle = (2 * Math.PI * i) / this.size;
      this.sinTable[i] = Math.sin(angle);
      this.cosTable[i] = Math.cos(angle);
    }
  }

  public forward(signal: Float32Array): Float32Array {
    // Copiar señal a buffer real
    this.real.set(signal);
    this.imag.fill(0);

    // Realizar FFT
    this.fft(this.real, this.imag);

    // Calcular magnitud
    const magnitude = new Float32Array(this.size / 2);
    for (let i = 0; i < this.size / 2; i++) {
      magnitude[i] = Math.sqrt(
        this.real[i] * this.real[i] + 
        this.imag[i] * this.imag[i]
      );
    }

    return magnitude;
  }

  private fft(real: Float32Array, imag: Float32Array): void {
    // Implementación optimizada de FFT in-place
    // Reordenamiento bit-reversal
    this.bitreversal(real, imag);

    // Cálculo de FFT
    for (let size = 2; size <= this.size; size *= 2) {
      const halfsize = size / 2;
      const tablestep = this.size / size;
      
      for (let i = 0; i < this.size; i += size) {
        for (let j = i, k = 0; j < i + halfsize; j++, k += tablestep) {
          const tr = real[j+halfsize] * this.cosTable[k] + 
                    imag[j+halfsize] * this.sinTable[k];
          const ti = imag[j+halfsize] * this.cosTable[k] - 
                    real[j+halfsize] * this.sinTable[k];
          
          real[j + halfsize] = real[j] - tr;
          imag[j + halfsize] = imag[j] - ti;
          real[j] += tr;
          imag[j] += ti;
        }
      }
    }
  }

  private bitreversal(real: Float32Array, imag: Float32Array): void {
    for (let i = 0; i < this.size; i++) {
      const j = this.reverseBits(i);
      if (j > i) {
        [real[i], real[j]] = [real[j], real[i]];
        [imag[i], imag[j]] = [imag[j], imag[i]];
      }
    }
  }

  private reverseBits(index: number): number {
    let reversed = 0;
    let bits = Math.log2(this.size);
    
    for (let i = 0; i < bits; i++) {
      reversed = (reversed << 1) | (index & 1);
      index >>= 1;
    }
    
    return reversed;
  }
}
