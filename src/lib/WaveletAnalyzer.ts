import {
  WaveletConfig, WaveletType, WaveletFeatures,
  FrequencyBand, SpectralAnalysis, WaveletCoefficients,
  DecompositionLevel, QualityMetrics, AnalysisResult
} from '@/types';

/**
 * Analizador Wavelet avanzado para señales PPG
 * Implementa análisis multi-resolución y detección de características
 * @version 2.0.0
 */
export class WaveletAnalyzer {
  // Configuración del analizador
  private readonly config: WaveletConfig = {
    waveletType: 'db4',           // Daubechies 4
    maxLevel: 8,                  // Niveles de descomposición
    threshold: 0.1,               // Umbral de coeficientes
    useAdaptiveThreshold: true,   // Umbral adaptativo
    windowSize: 256,              // Tamaño de ventana
    overlapSize: 128,            // Solapamiento
    samplingRate: 30             // Frecuencia de muestreo
  };

  // Coeficientes wavelet pre-calculados
  private readonly coefficients = {
    lowPass: new Float32Array(8),
    highPass: new Float32Array(8),
    reconstruction: new Float32Array(8)
  };

  // Buffers optimizados
  private readonly buffers = {
    input: new Float32Array(1024),
    coeffs: new Float32Array(1024),
    temp: new Float32Array(1024),
    output: new Float32Array(1024)
  };

  // Estado del análisis
  private state = {
    lastDecomposition: null as WaveletCoefficients | null,
    energyDistribution: new Float32Array(8),
    noiseLevel: 0,
    signalQuality: 1,
    frameCount: 0
  };

  constructor(config?: Partial<WaveletConfig>) {
    this.initialize(config);
  }

  /**
   * Análisis wavelet principal
   */
  public analyze(signal: number[]): AnalysisResult {
    try {
      // 1. Preparación de señal
      const prepared = this.prepareSignal(signal);

      // 2. Descomposición wavelet
      const decomposition = this.decompose(prepared);

      // 3. Análisis de coeficientes
      const features = this.extractFeatures(decomposition);

      // 4. Análisis de calidad
      const quality = this.assessQuality(features);

      // 5. Detección de características
      const characteristics = this.detectCharacteristics(decomposition);

      // 6. Análisis espectral
      const spectral = this.analyzeSpectrum(decomposition);

      // 7. Actualización de estado
      this.updateState(decomposition, features);

      return {
        decomposition,
        features,
        quality,
        characteristics,
        spectral
      };

    } catch (error) {
      console.error('Error en análisis wavelet:', error);
      return this.createEmptyResult();
    }
  }

  /**
   * Descomposición wavelet multi-nivel
   */
  private decompose(signal: number[]): WaveletCoefficients {
    const coeffs: WaveletCoefficients = {
      approximation: [],
      details: []
    };

    let currentSignal = [...signal];

    for (let level = 1; level <= this.config.maxLevel; level++) {
      // Descomposición de un nivel
      const levelDecomp = this.decomposeLevel(currentSignal);

      // Almacenar coeficientes de detalle
      coeffs.details.push(levelDecomp.details);

      // Preparar para siguiente nivel
      currentSignal = levelDecomp.approximation;

      // Verificar si continuar
      if (currentSignal.length < this.coefficients.lowPass.length) {
        break;
      }
    }

    coeffs.approximation = currentSignal;
    return coeffs;
  }

  /**
   * Descomposición de un nivel
   */
  private decomposeLevel(signal: number[]): DecompositionLevel {
    const len = signal.length;
    const halfLen = Math.floor(len / 2);
    
    const approximation = new Float32Array(halfLen);
    const details = new Float32Array(halfLen);

    for (let i = 0; i < halfLen; i++) {
      let sumLow = 0;
      let sumHigh = 0;

      for (let j = 0; j < this.coefficients.lowPass.length; j++) {
        const idx = 2 * i + j;
        if (idx < len) {
          sumLow += signal[idx] * this.coefficients.lowPass[j];
          sumHigh += signal[idx] * this.coefficients.highPass[j];
        }
      }

      approximation[i] = sumLow;
      details[i] = sumHigh;
    }

    return {
      approximation: Array.from(approximation),
      details: Array.from(details)
    };
  }

  /**
   * Extracción de características
   */
  private extractFeatures(decomp: WaveletCoefficients): WaveletFeatures {
    // Energía por nivel
    const energyLevels = this.calculateEnergyLevels(decomp);

    // Ratios de energía
    const energyRatios = this.calculateEnergyRatios(energyLevels);

    // Estadísticas de coeficientes
    const statistics = this.calculateStatistics(decomp);

    // Características de forma
    const shape = this.analyzeShape(decomp);

    // Características espectrales
    const spectral = this.analyzeSpectralFeatures(decomp);

    return {
      energyLevels,
      energyRatios,
      statistics,
      shape,
      spectral
    };
  }

  /**
   * Análisis de calidad
   */
  private assessQuality(features: WaveletFeatures): QualityMetrics {
    // Análisis de energía
    const energyQuality = this.assessEnergyDistribution(features.energyLevels);

    // Análisis de ruido
    const noiseQuality = this.assessNoiseLevel(features.statistics);

    // Análisis de forma
    const shapeQuality = this.assessShapeCharacteristics(features.shape);

    // Análisis espectral
    const spectralQuality = this.assessSpectralQuality(features.spectral);

    // Calidad general
    const overall = this.calculateOverallQuality({
      energyQuality,
      noiseQuality,
      shapeQuality,
      spectralQuality
    });

    return {
      energy: energyQuality,
      noise: noiseQuality,
      shape: shapeQuality,
      spectral: spectralQuality,
      overall
    };
  }

  /**
   * Detección de características específicas
   */
  private detectCharacteristics(decomp: WaveletCoefficients): any {
    // Detección de picos
    const peaks = this.detectPeaks(decomp);

    // Detección de valles
    const valleys = this.detectValleys(decomp);

    // Análisis de periodicidad
    const periodicity = this.analyzePeriodicity(peaks, valleys);

    // Detección de artefactos
    const artifacts = this.detectArtifacts(decomp);

    return {
      peaks,
      valleys,
      periodicity,
      artifacts
    };
  }

  /**
   * Análisis espectral
   */
  private analyzeSpectrum(decomp: WaveletCoefficients): SpectralAnalysis {
    // Análisis de frecuencia
    const frequencies = this.analyzeFrequencies(decomp);

    // Análisis de bandas
    const bands = this.analyzeBands(frequencies);

    // Análisis de coherencia
    const coherence = this.analyzeCoherence(frequencies);

    return {
      frequencies,
      bands,
      coherence
    };
  }

  /**
   * Métodos de utilidad
   */
  private prepareSignal(signal: number[]): number[] {
    // Validación
    if (!signal?.length) return [];

    // Padding si es necesario
    const padded = this.padSignal(signal);

    // Normalización
    const normalized = this.normalize(padded);

    // Eliminación de tendencia
    return this.removeTrend(normalized);
  }

  private padSignal(signal: number[]): number[] {
    const nextPow2 = Math.pow(2, Math.ceil(Math.log2(signal.length)));
    const padded = new Float32Array(nextPow2);
    padded.set(signal);
    return Array.from(padded);
  }

  private normalize(signal: number[]): number[] {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const std = Math.sqrt(signal.reduce((a, b) => a + (b - mean) ** 2, 0) / signal.length);
    return signal.map(x => (x - mean) / std);
  }

  /**
   * Métodos públicos adicionales
   */
  public setConfig(config: Partial<WaveletConfig>): void {
    Object.assign(this.config, config);
    this.initializeCoefficients();
  }

  public reset(): void {
    this.state = {
      lastDecomposition: null,
      energyDistribution: new Float32Array(8),
      noiseLevel: 0,
      signalQuality: 1,
      frameCount: 0
    };
    this.resetBuffers();
  }

  public getMetrics(): any {
    return {
      energyDistribution: Array.from(this.state.energyDistribution),
      noiseLevel: this.state.noiseLevel,
      signalQuality: this.state.signalQuality,
      frameCount: this.state.frameCount
    };
  }

  /**
   * Limpieza y disposición
   */
  public dispose(): void {
    this.reset();
    this.clearBuffers();
  }
}
