import {
  PulseConfig, PulseAnalysis, BeatFeatures,
  WaveformAnalysis, BeatSegmentation, PulseMetrics,
  TemporalAnalysis, MorphologyAnalysis, BeatQuality,
  RhythmAnalysis, VariabilityAnalysis, BeatClassification,
  PerfusionIndex, OxygenSaturation
} from '@/types';

/**
 * Analizador avanzado de pulso cardíaco
 * Implementa técnicas de última generación en análisis PPG
 * @version 2.0.0
 */
export class PulseAnalyzer {
  // Configuración optimizada
  private readonly config: PulseConfig = {
    sampleRate: 30,           // Hz
    windowSize: 256,          // Muestras
    beatDetection: {
      minAmplitude: 0.1,      // Amplitud mínima
      maxInterval: 2.0,       // Segundos
      minInterval: 0.4,       // Segundos
      threshold: 'adaptive',   // Umbral adaptativo
      refinement: 'quadratic' // Refinamiento cuadrático
    },
    waveform: {
      segmentPoints: 128,     // Puntos por segmento
      landmarks: [
        'onset',              // Inicio de pulso
        'systolic_peak',      // Pico sistólico
        'dicrotic_notch',     // Muesca dicrótica
        'diastolic_peak',     // Pico diastólico
        'end'                 // Fin de pulso
      ],
      normalization: 'amplitude', // Normalización
      alignment: 'peak'       // Alineación
    },
    analysis: {
      morphology: {
        features: [
          'amplitude',        // Amplitud
          'width',           // Ancho
          'slope',           // Pendiente
          'area',            // Área
          'symmetry'         // Simetría
        ],
        templates: 5,        // Plantillas de forma
        matching: 'dtw'      // Dynamic Time Warping
      },
      rhythm: {
        minBeats: 5,         // Beats mínimos
        maxGap: 3.0,         // Segundos
        regularityThreshold: 0.8, // Regularidad
        variabilityMetrics: [
          'sdnn',            // Desviación estándar
          'rmssd',           // Root Mean Square
          'pnn50',           // Porcentaje NN50
          'triangular_index' // Índice triangular
        ]
      },
      perfusion: {
        method: 'ac_dc_ratio', // Método de perfusión
        calibration: 'dynamic', // Calibración
        averaging: 10         // Ventana de promedio
      },
      oxygenation: {
        wavelengths: [
          660,               // Rojo (nm)
          940                // Infrarrojo (nm)
        ],
        calibration: 'empirical', // Calibración
        smoothing: 'kalman'  // Suavizado
      }
    },
    quality: {
      minQuality: 0.7,       // Calidad mínima
      metrics: [
        'snr',               // Relación señal-ruido
        'regularity',        // Regularidad
        'perfusion',         // Perfusión
        'artifact_free'      // Libre de artefactos
      ],
      validation: 'multi_parameter' // Validación
    }
  };

  // Procesadores especializados
  private readonly beatDetector: BeatSegmentation;
  private readonly waveformAnalyzer: WaveformAnalysis;
  private readonly morphologyAnalyzer: MorphologyAnalysis;
  private readonly rhythmAnalyzer: RhythmAnalysis;
  private readonly variabilityAnalyzer: VariabilityAnalysis;
  private readonly perfusionAnalyzer: PerfusionIndex;
  private readonly oxygenationAnalyzer: OxygenSaturation;

  // Buffers optimizados
  private readonly buffers = {
    signal: new Float64Array(1024),
    beats: new Float64Array(256),
    features: new Float64Array(128),
    templates: new Float64Array(5 * 128),
    metrics: new Float64Array(64)
  };

  // Estado del analizador
  private readonly state = {
    beatHistory: [] as BeatFeatures[],
    templateHistory: [] as Float64Array[],
    qualityHistory: [] as number[],
    lastValidBeat: null as BeatFeatures | null,
    calibrationState: {
      perfusion: new Float64Array(10),
      oxygenation: new Float64Array(10)
    }
  };

  constructor() {
    this.initializeAnalyzer();
  }

  /**
   * Análisis principal de pulso
   * Implementa pipeline completo de análisis PPG
   */
  public analyze(signal: Float64Array): PulseAnalysis {
    try {
      // 1. Validación de señal
      if (!this.validateSignal(signal)) {
        throw new Error('Invalid signal for pulse analysis');
      }

      // 2. Detección de pulsos
      const beats = this.detectBeats(signal);

      // 3. Análisis de forma de onda
      const waveforms = this.analyzeWaveforms(beats);

      // 4. Análisis morfológico
      const morphology = this.analyzeMorphology(waveforms);

      // 5. Análisis de ritmo
      const rhythm = this.analyzeRhythm(beats);

      // 6. Análisis de variabilidad
      const variability = this.analyzeVariability(beats);

      // 7. Índice de perfusión
      const perfusion = this.analyzePerfusion(signal);

      // 8. Saturación de oxígeno
      const oxygenation = this.analyzeOxygenation(signal);

      // 9. Análisis de calidad
      const quality = this.analyzeQuality({
        beats,
        morphology,
        rhythm,
        perfusion,
        oxygenation
      });

      // 10. Clasificación de pulsos
      const classification = this.classifyBeats(
        beats,
        morphology
      );

      // 11. Actualización de estado
      this.updateState({
        beats,
        quality,
        morphology
      });

      return {
        beats,
        waveforms,
        morphology,
        rhythm,
        variability,
        perfusion,
        oxygenation,
        quality,
        classification
      };

    } catch (error) {
      console.error('Error in pulse analysis:', error);
      return this.handleAnalysisError(error);
    }
  }

  /**
   * Detección avanzada de pulsos
   */
  private detectBeats(signal: Float64Array): BeatFeatures[] {
    // 1. Pre-procesamiento
    const prepared = this.prepareSignal(signal);

    // 2. Detección de picos
    const peaks = this.detectPeaks(prepared);

    // 3. Refinamiento de ubicación
    const refined = this.refinePeaks(peaks, prepared);

    // 4. Segmentación de pulsos
    const segments = this.segmentBeats(refined, prepared);

    // 5. Extracción de características
    return this.extractBeatFeatures(segments);
  }

  /**
   * Análisis de forma de onda
   */
  private analyzeWaveforms(beats: BeatFeatures[]): WaveformAnalysis {
    // 1. Normalización
    const normalized = this.normalizeWaveforms(beats);

    // 2. Alineación
    const aligned = this.alignWaveforms(normalized);

    // 3. Detección de landmarks
    const landmarks = this.detectLandmarks(aligned);

    // 4. Análisis temporal
    const temporal = this.analyzeTemporalFeatures(
      aligned,
      landmarks
    );

    // 5. Análisis de forma
    return this.analyzeWaveformShape(
      aligned,
      landmarks,
      temporal
    );
  }

  /**
   * Análisis morfológico avanzado
   */
  private analyzeMorphology(
    waveforms: WaveformAnalysis
  ): MorphologyAnalysis {
    // 1. Extracción de características
    const features = this.extractMorphologyFeatures(
      waveforms
    );

    // 2. Comparación con plantillas
    const templates = this.compareWithTemplates(
      features
    );

    // 3. Análisis de variación
    const variation = this.analyzeMorphologyVariation(
      features
    );

    // 4. Clasificación de forma
    const shape = this.classifyMorphologyShape(
      features,
      templates
    );

    // 5. Métricas morfológicas
    return this.calculateMorphologyMetrics(
      features,
      templates,
      variation,
      shape
    );
  }

  /**
   * Análisis de ritmo cardíaco
   */
  private analyzeRhythm(beats: BeatFeatures[]): RhythmAnalysis {
    // 1. Intervalos RR
    const intervals = this.calculateRRIntervals(beats);

    // 2. Análisis de regularidad
    const regularity = this.analyzeRegularity(intervals);

    // 3. Detección de arritmias
    const arrhythmias = this.detectArrhythmias(
      intervals,
      regularity
    );

    // 4. Tendencias de ritmo
    const trends = this.analyzeRhythmTrends(intervals);

    // 5. Métricas de ritmo
    return this.calculateRhythmMetrics(
      intervals,
      regularity,
      arrhythmias,
      trends
    );
  }

  /**
   * Análisis de variabilidad
   */
  private analyzeVariability(beats: BeatFeatures[]): VariabilityAnalysis {
    // 1. Cálculo de métricas temporales
    const temporal = this.calculateTemporalMetrics(beats);

    // 2. Cálculo de métricas geométricas
    const geometric = this.calculateGeometricMetrics(beats);

    // 3. Análisis no lineal
    const nonlinear = this.calculateNonlinearMetrics(beats);

    // 4. Análisis frecuencial
    const frequency = this.calculateFrequencyMetrics(beats);

    // 5. Métricas de variabilidad
    return this.calculateVariabilityMetrics(
      temporal,
      geometric,
      nonlinear,
      frequency
    );
  }

  /**
   * Análisis de perfusión
   */
  private analyzePerfusion(signal: Float64Array): PerfusionIndex {
    // 1. Cálculo de componentes AC/DC
    const components = this.calculateACDCComponents(signal);

    // 2. Calibración dinámica
    const calibrated = this.calibratePerfusion(
      components,
      this.state.calibrationState.perfusion
    );

    // 3. Promediado temporal
    const averaged = this.averagePerfusion(
      calibrated,
      this.config.analysis.perfusion.averaging
    );

    // 4. Validación de medición
    const validated = this.validatePerfusion(averaged);

    // 5. Métricas de perfusión
    return this.calculatePerfusionMetrics(validated);
  }

  /**
   * Análisis de oxigenación
   */
  private analyzeOxygenation(signal: Float64Array): OxygenSaturation {
    // 1. Separación de longitudes de onda
    const wavelengths = this.separateWavelengths(signal);

    // 2. Cálculo de ratio R/IR
    const ratio = this.calculateRatioRIR(wavelengths);

    // 3. Calibración empírica
    const calibrated = this.calibrateOxygenation(
      ratio,
      this.state.calibrationState.oxygenation
    );

    // 4. Suavizado Kalman
    const smoothed = this.smoothOxygenation(calibrated);

    // 5. Métricas de oxigenación
    return this.calculateOxygenationMetrics(smoothed);
  }

  /**
   * Optimizaciones de bajo nivel
   */
  private calculateACDCComponents(
    signal: Float64Array
  ): { ac: number; dc: number } {
    let sumAC = 0;
    let sumDC = 0;
    let minVal = Infinity;
    let maxVal = -Infinity;

    // Procesamiento vectorizado
    for (let i = 0; i < signal.length; i += 4) {
      const val1 = signal[i];
      const val2 = signal[i + 1];
      const val3 = signal[i + 2];
      const val4 = signal[i + 3];

      // Componente DC
      sumDC += val1 + val2 + val3 + val4;

      // Valores extremos para AC
      minVal = Math.min(minVal, val1, val2, val3, val4);
      maxVal = Math.max(maxVal, val1, val2, val3, val4);
    }

    const dc = sumDC / signal.length;
    const ac = maxVal - minVal;

    return { ac, dc };
  }

  /**
   * Gestión de estado
   */
  private updateState(data: {
    beats: BeatFeatures[];
    quality: BeatQuality;
    morphology: MorphologyAnalysis;
  }): void {
    // 1. Actualización de historiales
    this.state.beatHistory.push(...data.beats);
    this.state.qualityHistory.push(data.quality.overall);

    // 2. Actualización de plantillas
    if (data.quality.overall > this.config.quality.minQuality) {
      this.updateTemplates(data.morphology);
    }

    // 3. Mantenimiento de historiales
    if (this.state.beatHistory.length > 100) {
      this.state.beatHistory = this.state.beatHistory.slice(-100);
      this.state.qualityHistory = this.state.qualityHistory.slice(-100);
    }

    // 4. Actualización de último pulso válido
    if (data.beats.length > 0 && data.quality.overall > 0.8) {
      this.state.lastValidBeat = data.beats[data.beats.length - 1];
    }
  }

  /**
   * Gestión de recursos
   */
  public dispose(): void {
    try {
      // 1. Limpieza de procesadores
      this.beatDetector.dispose();
      this.waveformAnalyzer.dispose();
      this.morphologyAnalyzer.dispose();
      this.rhythmAnalyzer.dispose();
      this.variabilityAnalyzer.dispose();
      this.perfusionAnalyzer.dispose();
      this.oxygenationAnalyzer.dispose();

      // 2. Limpieza de buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // 3. Limpieza de estado
      this.state.beatHistory = [];
      this.state.templateHistory = [];
      this.state.qualityHistory = [];
      this.state.lastValidBeat = null;
      this.state.calibrationState.perfusion.fill(0);
      this.state.calibrationState.oxygenation.fill(0);

    } catch (error) {
      console.error('Error in dispose:', error);
    }
  }
}
