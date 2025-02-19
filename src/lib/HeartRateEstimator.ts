import {
  HREstimationConfig, HeartRateResult, ConfidenceMetrics,
  PeakDetection, BeatMorphology, RRIntervals, BeatQuality,
  PeakValidation, EstimationMode, SignalQuality,
  FrequencyAnalysis, WaveletAnalysis
} from '@/types';

import { AdaptiveThreshold } from './AdaptiveThreshold';

/**
 * Estimador avanzado de ritmo cardíaco
 * Implementa fusión multi-modal y técnicas de última generación
 * @version 2.0.0
 */
export class HeartRateEstimator {
  // Configuración optimizada
  private readonly config: HREstimationConfig = {
    sampleRate: 30,           // Hz
    windowSize: 256,          // Muestras
    minHR: 30,               // BPM mínimo
    maxHR: 240,              // BPM máximo
    peakWidth: [0.1, 0.4],   // Segundos
    adaptiveWindow: true,     // Ventana adaptativa
    
    // Configuración de detección
    detection: {
      minPeakHeight: 0.3,     // Altura relativa
      minPeakDistance: 0.25,  // Segundos
      maxPeakCount: 20,       // Por ventana
      noiseThreshold: 0.1     // Nivel de ruido
    },

    // Configuración de validación
    validation: {
      morphologyCheck: true,  // Validar forma
      intervalCheck: true,    // Validar intervalos
      amplitudeCheck: true,   // Validar amplitud
      coherenceCheck: true    // Validar coherencia
    },

    // Configuración de fusión
    fusion: {
      timeWeight: 0.4,        // Peso dominio temporal
      freqWeight: 0.3,        // Peso dominio frecuencial
      waveletWeight: 0.3,     // Peso dominio wavelet
      adaptiveWeights: true   // Pesos adaptativos
    },

    // Umbrales de calidad
    quality: {
      minSNR: 5.0,           // dB
      minStability: 0.7,      // 0-1
      minConfidence: 0.8,     // 0-1
      maxVariability: 0.2     // 0-1
    }
  };

  // Procesadores especializados
  private readonly peakDetector: PeakDetection;
  private readonly morphologyAnalyzer: BeatMorphology;
  private readonly intervalAnalyzer: RRIntervals;
  private readonly qualityAnalyzer: SignalQuality;
  private readonly freqAnalyzer: FrequencyAnalysis;
  private readonly waveletAnalyzer: WaveletAnalysis;

  // Buffers optimizados
  private readonly buffers = {
    signal: new Float64Array(1024),
    peaks: new Float64Array(128),
    intervals: new Float64Array(128),
    templates: new Float64Array(512),
    features: new Float64Array(64),
    confidence: new Float64Array(32)
  };

  // Estado del estimador
  private state = {
    lastValidHR: 75,         // BPM
    hrHistory: [] as number[],
    confidenceHistory: [] as number[],
    peakHistory: [] as number[],
    qualityHistory: [] as number[],
    adaptiveThresholds: new AdaptiveThreshold()
  };

  constructor() {
    this.initializeEstimator();
  }

  /**
   * Estimación principal de ritmo cardíaco
   * Implementa fusión multi-modal y validación avanzada
   */
  public estimate(signal: Float64Array): HeartRateResult {
    try {
      // 1. Validación y pre-procesamiento
      if (!this.validateSignal(signal)) {
        throw new Error('Invalid signal for HR estimation');
      }

      // 2. Análisis de calidad
      const quality = this.analyzeSignalQuality(signal);
      if (!this.isQualityAcceptable(quality)) {
        return this.handleLowQuality(quality);
      }

      // 3. Estimación multi-modal
      const estimates = {
        time: this.estimateFromTimeDomain(signal),
        frequency: this.estimateFromFrequencyDomain(signal),
        wavelet: this.estimateFromWaveletDomain(signal)
      };

      // 4. Fusión adaptativa
      const fusedHR = this.fuseEstimates(estimates, quality);

      // 5. Validación avanzada
      const validation = this.validateEstimate(fusedHR, estimates);

      // 6. Métricas de confianza
      const confidence = this.calculateConfidence(
        fusedHR,
        estimates,
        validation,
        quality
      );

      // 7. Actualización de estado
      this.updateState(fusedHR, confidence, quality);

      // 8. Resultado final
      return {
        heartRate: fusedHR,
        confidence: confidence,
        quality: quality,
        validation: validation,
        estimates: estimates
      };

    } catch (error) {
      console.error('Error in HR estimation:', error);
      return this.handleEstimationError(error);
    }
  }

  /**
   * Estimación en dominio temporal
   */
  private estimateFromTimeDomain(signal: Float64Array): number {
    // 1. Detección de picos
    const peaks = this.detectPeaks(signal);

    // 2. Validación de picos
    const validPeaks = this.validatePeaks(peaks, signal);

    // 3. Análisis de intervalos
    const intervals = this.analyzeIntervals(validPeaks);

    // 4. Análisis morfológico
    const morphology = this.analyzeMorphology(signal, validPeaks);

    // 5. Estimación final temporal
    return this.calculateTimeBasedHR(intervals, morphology);
  }

  /**
   * Estimación en dominio frecuencial
   */
  private estimateFromFrequencyDomain(signal: Float64Array): number {
    // 1. Análisis espectral
    const spectral = this.freqAnalyzer.analyze(signal);

    // 2. Detección de frecuencia fundamental
    const fundamental = this.detectFundamentalFrequency(spectral);

    // 3. Análisis de armónicos
    const harmonics = this.analyzeHarmonics(spectral);

    // 4. Validación espectral
    const validation = this.validateSpectralEstimate(
      fundamental,
      harmonics
    );

    // 5. Estimación final frecuencial
    return this.calculateFreqBasedHR(fundamental, validation);
  }

  /**
   * Estimación en dominio wavelet
   */
  private estimateFromWaveletDomain(signal: Float64Array): number {
    // 1. Análisis wavelet
    const wavelet = this.waveletAnalyzer.analyze(signal);

    // 2. Análisis de sub-bandas
    const subbands = this.analyzeSubbands(wavelet);

    // 3. Detección de ritmo en escalas
    const scaleRates = this.detectScaleRates(subbands);

    // 4. Validación wavelet
    const validation = this.validateWaveletEstimate(scaleRates);

    // 5. Estimación final wavelet
    return this.calculateWaveletBasedHR(scaleRates, validation);
  }

  /**
   * Fusión adaptativa de estimaciones
   */
  private fuseEstimates(
    estimates: {
      time: number;
      frequency: number;
      wavelet: number;
    },
    quality: SignalQuality
  ): number {
    // 1. Cálculo de pesos adaptativos
    const weights = this.calculateAdaptiveWeights(
      estimates,
      quality
    );

    // 2. Fusión ponderada
    const fusedHR = (
      estimates.time * weights.time +
      estimates.frequency * weights.frequency +
      estimates.wavelet * weights.wavelet
    ) / (weights.time + weights.frequency + weights.wavelet);

    // 3. Validación de fusión
    return this.validateFusedEstimate(fusedHR, estimates, weights);
  }

  /**
   * Validación avanzada de estimaciones
   */
  private validateEstimate(
    hr: number,
    estimates: {
      time: number;
      frequency: number;
      wavelet: number;
    }
  ): PeakValidation {
    // 1. Validación fisiológica
    const physiological = this.validatePhysiological(hr);

    // 2. Validación de consistencia
    const consistency = this.validateConsistency(
      hr,
      this.state.lastValidHR
    );

    // 3. Validación de coherencia
    const coherence = this.validateCoherence(
      hr,
      estimates
    );

    // 4. Validación histórica
    const historical = this.validateHistorical(
      hr,
      this.state.hrHistory
    );

    return {
      physiological,
      consistency,
      coherence,
      historical,
      overall: this.calculateOverallValidation([
        physiological,
        consistency,
        coherence,
        historical
      ])
    };
  }

  /**
   * Cálculo de métricas de confianza
   */
  private calculateConfidence(
    hr: number,
    estimates: {
      time: number;
      frequency: number;
      wavelet: number;
    },
    validation: PeakValidation,
    quality: SignalQuality
  ): ConfidenceMetrics {
    // 1. Confianza de estimación
    const estimationConfidence = this.calculateEstimationConfidence(
      hr,
      estimates
    );

    // 2. Confianza de validación
    const validationConfidence = this.calculateValidationConfidence(
      validation
    );

    // 3. Confianza de calidad
    const qualityConfidence = this.calculateQualityConfidence(
      quality
    );

    // 4. Confianza histórica
    const historicalConfidence = this.calculateHistoricalConfidence(
      hr,
      this.state.hrHistory,
      this.state.confidenceHistory
    );

    return {
      estimation: estimationConfidence,
      validation: validationConfidence,
      quality: qualityConfidence,
      historical: historicalConfidence,
      overall: this.calculateOverallConfidence([
        estimationConfidence,
        validationConfidence,
        qualityConfidence,
        historicalConfidence
      ])
    };
  }

  /**
   * Gestión de estado y recursos
   */
  private updateState(
    hr: number,
    confidence: ConfidenceMetrics,
    quality: SignalQuality
  ): void {
    // 1. Actualización de historiales
    this.state.hrHistory.push(hr);
    this.state.confidenceHistory.push(confidence.overall);
    this.state.qualityHistory.push(quality.overall);

    // 2. Mantener longitud máxima
    if (this.state.hrHistory.length > 30) {
      this.state.hrHistory.shift();
      this.state.confidenceHistory.shift();
      this.state.qualityHistory.shift();
    }

    // 3. Actualización de último HR válido
    if (confidence.overall > this.config.quality.minConfidence) {
      this.state.lastValidHR = hr;
    }

    // 4. Actualización de umbrales adaptativos
    this.state.adaptiveThresholds.update(hr, confidence.overall);
  }

  public dispose(): void {
    try {
      // 1. Limpieza de procesadores
      this.peakDetector.dispose();
      this.morphologyAnalyzer.dispose();
      this.intervalAnalyzer.dispose();
      this.qualityAnalyzer.dispose();
      this.freqAnalyzer.dispose();
      this.waveletAnalyzer.dispose();

      // 2. Limpieza de buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // 3. Reseteo de estado
      this.state = {
        lastValidHR: 75,
        hrHistory: [],
        confidenceHistory: [],
        peakHistory: [],
        qualityHistory: [],
        adaptiveThresholds: new AdaptiveThreshold()
      };

    } catch (error) {
      console.error('Error in dispose:', error);
    }
  }
}
