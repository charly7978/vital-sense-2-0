import {
  FrequencyConfig, SpectralAnalysis, FrequencyBands,
  HarmonicStructure, PhaseAnalysis, CoherenceMetrics,
  TimeFrequencyMap, SpectralFeatures, ComplexArray,
  OptimizedFFT, WindowFunction, SpectralPeaks
} from '@/types';

/**
 * Analizador avanzado de frecuencia para PPG
 * Implementa técnicas espectrales de última generación
 * @version 2.0.0
 */
export class FrequencyAnalyzer {
  // Configuración optimizada
  private readonly config: FrequencyConfig = {
    sampleRate: 30,          // Hz
    fftSize: 1024,           // Potencia de 2 para FFT óptima
    hopSize: 256,            // Avance entre ventanas
    minFreq: 0.5,           // Hz (30 BPM)
    maxFreq: 4.0,           // Hz (240 BPM)
    harmonicCount: 4,        // Número de armónicos
    windowType: 'blackman',  // Ventana óptima
    zeroPadding: 2,         // Factor de zero-padding
    
    // Configuración espectral avanzada
    spectral: {
      minPeakHeight: 0.1,    // Altura mínima de picos
      minPeakDistance: 0.25, // Hz entre picos
      maxPeakCount: 8,       // Máximo número de picos
      noiseFloor: -60,       // dB
      dynamicRange: 90       // dB
    },

    // Bandas de frecuencia optimizadas
    bands: {
      sub: [0.0, 0.5],      // Sub-cardíaca
      fundamental: [0.5, 2.0], // Fundamental
      harmonic1: [2.0, 3.5], // Primer armónico
      harmonic2: [3.5, 5.0], // Segundo armónico
      noise: [5.0, 15.0]     // Banda de ruido
    }
  };

  // Procesadores optimizados
  private readonly fft: OptimizedFFT;
  private readonly windows: Map<string, Float64Array>;
  private readonly complexBuffers: {
    time: ComplexArray;
    freq: ComplexArray;
    correlation: ComplexArray;
    convolution: ComplexArray;
  };

  // Buffers de análisis pre-allocados
  private readonly buffers = {
    magnitude: new Float64Array(this.config.fftSize),
    phase: new Float64Array(this.config.fftSize),
    power: new Float64Array(this.config.fftSize),
    coherence: new Float64Array(this.config.fftSize),
    timeFreq: new Float64Array(this.config.fftSize * this.config.hopSize),
    features: new Float64Array(64)
  };

  // Cache de resultados
  private readonly resultCache = new WeakMap<Float64Array, SpectralAnalysis>();

  constructor() {
    this.initializeAnalyzer();
  }

  /**
   * Análisis espectral principal
   * Implementa pipeline avanzado de procesamiento frecuencial
   */
  public analyze(signal: Float64Array): SpectralAnalysis {
    try {
      // 1. Validación y preparación
      if (!this.validateSignal(signal)) {
        throw new Error('Invalid signal for frequency analysis');
      }

      // 2. Cache check
      const cached = this.resultCache.get(signal);
      if (cached) return cached;

      // 3. Pre-procesamiento
      const prepared = this.prepareSignal(signal);

      // 4. Análisis espectral completo
      const spectral = this.computeSpectralAnalysis(prepared);

      // 5. Análisis de armónicos
      const harmonics = this.analyzeHarmonics(spectral);

      // 6. Análisis de fase
      const phase = this.analyzePhase(spectral);

      // 7. Análisis de coherencia
      const coherence = this.analyzeCoherence(spectral);

      // 8. Extracción de características
      const features = this.extractSpectralFeatures(spectral);

      // 9. Análisis tiempo-frecuencia
      const timeFreq = this.computeTimeFrequencyMap(prepared);

      // 10. Resultados finales
      const result = {
        spectral,
        harmonics,
        phase,
        coherence,
        features,
        timeFreq
      };

      // 11. Cache update
      this.resultCache.set(signal, result);

      return result;

    } catch (error) {
      console.error('Error in frequency analysis:', error);
      return this.handleAnalysisError(error);
    }
  }

  /**
   * Análisis espectral avanzado
   */
  private computeSpectralAnalysis(signal: Float64Array): SpectralAnalysis {
    // 1. Aplicar ventana
    const windowed = this.applyWindow(signal, this.config.windowType);

    // 2. Zero padding
    const padded = this.zeroPad(windowed, this.config.zeroPadding);

    // 3. FFT optimizada
    const spectrum = this.computeOptimizedFFT(padded);

    // 4. Análisis de magnitud
    const magnitude = this.computeMagnitudeSpectrum(spectrum);

    // 5. Análisis de potencia
    const power = this.computePowerSpectrum(magnitude);

    // 6. Detección de picos
    const peaks = this.detectSpectralPeaks(power);

    // 7. Análisis de bandas
    const bands = this.analyzeFrequencyBands(power);

    return {
      magnitude,
      power,
      peaks,
      bands,
      fundamentalFreq: this.estimateFundamentalFrequency(peaks)
    };
  }

  /**
   * Análisis armónico avanzado
   */
  private analyzeHarmonics(spectral: SpectralAnalysis): HarmonicStructure {
    const fundamental = spectral.fundamentalFreq;
    const harmonics: number[] = [];
    const ratios: number[] = [];
    const powers: number[] = [];

    for (let i = 1; i <= this.config.harmonicCount; i++) {
      const harmonicFreq = fundamental * i;
      const harmonicPower = this.findHarmonicPower(
        spectral.power,
        harmonicFreq
      );

      harmonics.push(harmonicFreq);
      powers.push(harmonicPower);
      if (i > 1) {
        ratios.push(harmonicPower / powers[0]);
      }
    }

    return {
      frequencies: harmonics,
      powers,
      ratios,
      harmonicity: this.calculateHarmonicity(powers)
    };
  }

  /**
   * Análisis de fase avanzado
   */
  private analyzePhase(spectral: SpectralAnalysis): PhaseAnalysis {
    // 1. Fase instantánea
    const instantPhase = this.computeInstantaneousPhase();

    // 2. Fase envolvente
    const phaseEnvelope = this.computePhaseEnvelope();

    // 3. Coherencia de fase
    const phaseCoherence = this.computePhaseCoherence();

    // 4. Sincronización de fase
    const phaseSynch = this.computePhaseSynchronization();

    return {
      instantPhase,
      phaseEnvelope,
      phaseCoherence,
      phaseSynch
    };
  }

  /**
   * Análisis de coherencia avanzado
   */
  private analyzeCoherence(spectral: SpectralAnalysis): CoherenceMetrics {
    // 1. Coherencia espectral
    const spectralCoherence = this.computeSpectralCoherence();

    // 2. Coherencia de magnitud
    const magnitudeCoherence = this.computeMagnitudeCoherence();

    // 3. Coherencia wavelet
    const waveletCoherence = this.computeWaveletCoherence();

    return {
      spectral: spectralCoherence,
      magnitude: magnitudeCoherence,
      wavelet: waveletCoherence,
      overall: this.computeOverallCoherence([
        spectralCoherence,
        magnitudeCoherence,
        waveletCoherence
      ])
    };
  }

  /**
   * Extracción de características espectrales
   */
  private extractSpectralFeatures(spectral: SpectralAnalysis): SpectralFeatures {
    return {
      centroid: this.computeSpectralCentroid(spectral.power),
      bandwidth: this.computeSpectralBandwidth(spectral.power),
      flatness: this.computeSpectralFlatness(spectral.power),
      rolloff: this.computeSpectralRolloff(spectral.power),
      flux: this.computeSpectralFlux(spectral.power),
      spread: this.computeSpectralSpread(spectral.power),
      kurtosis: this.computeSpectralKurtosis(spectral.power),
      skewness: this.computeSpectralSkewness(spectral.power)
    };
  }

  /**
   * Análisis tiempo-frecuencia avanzado
   */
  private computeTimeFrequencyMap(signal: Float64Array): TimeFrequencyMap {
    // 1. STFT optimizada
    const stft = this.computeOptimizedSTFT(signal);

    // 2. Espectrograma
    const spectrogram = this.computeSpectrogram(stft);

    // 3. Escalograma
    const scalogram = this.computeScalogram(signal);

    // 4. Representación de Wigner-Ville
    const wvd = this.computeWignerVille(signal);

    return {
      stft,
      spectrogram,
      scalogram,
      wvd,
      timeAxis: this.generateTimeAxis(),
      freqAxis: this.generateFrequencyAxis()
    };
  }

  /**
   * Optimizaciones de bajo nivel
   */
  private computeOptimizedFFT(signal: Float64Array): ComplexArray {
    return this.fft.forward(signal);
  }

  private computeOptimizedSTFT(signal: Float64Array): ComplexArray {
    const frameCount = Math.floor(
      (signal.length - this.config.fftSize) / this.config.hopSize
    ) + 1;

    const stft = new ComplexArray(
      frameCount * this.config.fftSize
    );

    for (let i = 0; i < frameCount; i++) {
      const frame = signal.subarray(
        i * this.config.hopSize,
        i * this.config.hopSize + this.config.fftSize
      );
      const windowed = this.applyWindow(frame, this.config.windowType);
      const spectrum = this.computeOptimizedFFT(windowed);
      stft.set(spectrum, i * this.config.fftSize);
    }

    return stft;
  }

  /**
   * Gestión de recursos
   */
  public dispose(): void {
    try {
      // 1. Limpieza de FFT
      this.fft.dispose();

      // 2. Limpieza de buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // 3. Limpieza de buffers complejos
      Object.values(this.complexBuffers).forEach(buffer => {
        buffer.dispose();
      });

      // 4. Limpieza de ventanas
      this.windows.clear();

      // 5. Limpieza de cache
      this.resultCache = new WeakMap();

    } catch (error) {
      console.error('Error in dispose:', error);
    }
  }
}
