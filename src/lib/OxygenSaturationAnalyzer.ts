import {
  SpO2Config, OxygenAnalysis, AbsorptionRatio,
  LightIntensity, SpO2Calibration, OxygenMetrics,
  WaveformQuality, RatioCalculation, SpO2Validation,
  CalibrationCurve, PerfusionIndex, SignalQuality
} from '@/types';

/**
 * Analizador avanzado de saturación de oxígeno
 * Implementa técnicas de última generación en análisis SpO2
 * @version 2.0.0
 */
export class OxygenSaturationAnalyzer {
  // Configuración optimizada
  private readonly config: SpO2Config = {
    sampleRate: 30,           // Hz
    windowSize: 256,          // Muestras
    
    // Análisis de luz
    light: {
      wavelengths: [
        660,                 // Rojo (nm)
        940                  // Infrarrojo (nm)
      ],
      intensityRange: {
        min: 0.1,            // Mínima intensidad
        max: 3.0             // Máxima intensidad
      },
      normalization: true,   // Normalización
      darkCurrent: true     // Corrección de corriente oscura
    },

    // Cálculo de ratio
    ratio: {
      method: 'peak_valley', // Método de cálculo
      window: 64,            // Ventana de análisis
      overlap: 32,           // Solapamiento
      filtering: {
        enabled: true,       // Filtrado
        type: 'median',      // Tipo de filtro
        order: 5             // Orden del filtro
      }
    },

    // Calibración
    calibration: {
      curve: 'empirical',    // Curva empírica
      coefficients: [
        -45.060,            // a0
        113.38,             // a1
        -25.387             // a2
      ],
      range: {
        min: 70,            // SpO2 mínimo
        max: 100            // SpO2 máximo
      },
      temperature: {
        compensation: true,  // Compensación
        reference: 37.0     // Temperatura de referencia
      }
    },

    // Perfusión
    perfusion: {
      calculation: true,     // Cálculo de PI
      threshold: 0.2,        // Umbral mínimo
      normalization: true,   // Normalización
      averaging: 'exponential' // Promediado
    },

    // Validación
    validation: {
      physiological: {
        range: {
          min: 70,          // SpO2 mínimo
          max: 100          // SpO2 máximo
        },
        delta: 4,           // Cambio máximo
        stability: 0.5      // Estabilidad mínima
      },
      quality: {
        minSignal: 0.7,     // Calidad mínima
        minPerfusion: 0.2,  // Perfusión mínima
        minStability: 0.8   // Estabilidad mínima
      }
    }
  };

  // Procesadores especializados
  private readonly ratioCalculator: RatioCalculation;
  private readonly calibrationCurve: CalibrationCurve;
  private readonly perfusionAnalyzer: PerfusionIndex;
  private readonly qualityAnalyzer: SignalQuality;
  private readonly validator: SpO2Validation;

  // Buffers optimizados
  private readonly buffers = {
    red: new Float64Array(512),
    infrared: new Float64Array(512),
    ratio: new Float64Array(128),
    perfusion: new Float64Array(64),
    temperature: new Float64Array(32)
  };

  // Estado del analizador
  private readonly state = {
    lastAnalysis: null as OxygenAnalysis | null,
    calibrationState: {
      curve: new Float64Array(3),
      temperature: 37.0,
      lastUpdate: 0
    },
    history: {
      spo2: [] as number[],
      ratio: [] as number[],
      perfusion: [] as number[],
      quality: [] as number[]
    },
    stability: {
      window: new Float64Array(10),
      index: 0,
      value: 1.0
    }
  };

  constructor() {
    this.initializeAnalyzer();
  }

  /**
   * Análisis principal de SpO2
   * Implementa pipeline completo de análisis
   */
  public analyze(data: {
    red: Float64Array;
    infrared: Float64Array;
    temperature?: number;
  }): OxygenAnalysis {
    try {
      // 1. Validación de entrada
      if (!this.validateInput(data)) {
        throw new Error('Invalid input for SpO2 analysis');
      }

      // 2. Normalización de señales
      const normalized = this.normalizeLightIntensities({
        red: data.red,
        infrared: data.infrared
      });

      // 3. Cálculo de ratio R/IR
      const ratio = this.calculateRatio(normalized);

      // 4. Análisis de perfusión
      const perfusion = this.analyzePerfusion(normalized);

      // 5. Compensación de temperatura
      const compensated = this.compensateTemperature(
        ratio,
        data.temperature
      );

      // 6. Cálculo de SpO2
      const spo2 = this.calculateSpO2(compensated);

      // 7. Análisis de calidad
      const quality = this.analyzeQuality({
        signals: normalized,
        ratio,
        perfusion
      });

      // 8. Validación fisiológica
      const validated = this.validateSpO2({
        spo2,
        quality,
        perfusion
      });

      // 9. Cálculo de métricas
      const metrics = this.calculateMetrics({
        spo2: validated,
        ratio,
        perfusion,
        quality
      });

      // 10. Actualización de estado
      this.updateState({
        spo2: validated,
        ratio,
        perfusion,
        quality
      });

      return {
        spo2: validated,
        perfusion,
        quality,
        metrics,
        timestamp: Date.now()
      };

    } catch (error) {
      console.error('Error in SpO2 analysis:', error);
      return this.handleAnalysisError(error);
    }
  }

  /**
   * Cálculo de ratio R/IR
   */
  private calculateRatio(
    signals: LightIntensity
  ): AbsorptionRatio {
    // 1. Detección de picos y valles
    const peaks = {
      red: this.detectPeaks(signals.red),
      infrared: this.detectPeaks(signals.infrared)
    };

    const valleys = {
      red: this.detectValleys(signals.red),
      infrared: this.detectValleys(signals.infrared)
    };

    // 2. Cálculo de ratio AC/DC
    const acdc = {
      red: this.calculateACDC(signals.red, peaks.red, valleys.red),
      infrared: this.calculateACDC(signals.infrared, peaks.infrared, valleys.infrared)
    };

    // 3. Cálculo de ratio R
    return {
      value: (acdc.red / acdc.infrared),
      confidence: this.calculateRatioConfidence(acdc),
      stability: this.calculateRatioStability(acdc)
    };
  }

  /**
   * Análisis de perfusión
   */
  private analyzePerfusion(
    signals: LightIntensity
  ): PerfusionIndex {
    // 1. Cálculo de índice de perfusión
    const pi = this.calculatePerfusionIndex(signals);

    // 2. Normalización
    const normalized = this.normalizePerfusion(pi);

    // 3. Promediado
    const averaged = this.averagePerfusion(normalized);

    return {
      value: averaged,
      quality: this.calculatePerfusionQuality(averaged),
      trend: this.analyzePerfusionTrend(averaged)
    };
  }

  /**
   * Optimizaciones de bajo nivel
   */
  private normalizeLightIntensities(
    signals: {
      red: Float64Array;
      infrared: Float64Array;
    }
  ): LightIntensity {
    const normalized = {
      red: new Float64Array(signals.red.length),
      infrared: new Float64Array(signals.infrared.length)
    };

    // Normalización vectorizada
    for (let i = 0; i < signals.red.length; i++) {
      normalized.red[i] = (signals.red[i] - this.config.light.intensityRange.min) /
        (this.config.light.intensityRange.max - this.config.light.intensityRange.min);
      
      normalized.infrared[i] = (signals.infrared[i] - this.config.light.intensityRange.min) /
        (this.config.light.intensityRange.max - this.config.light.intensityRange.min);
    }

    return normalized;
  }

  /**
   * Gestión de estado
   */
  private updateState(data: {
    spo2: number;
    ratio: AbsorptionRatio;
    perfusion: PerfusionIndex;
    quality: WaveformQuality;
  }): void {
    // 1. Actualización de último análisis
    this.state.lastAnalysis = {
      spo2: data.spo2,
      ratio: data.ratio,
      perfusion: data.perfusion,
      quality: data.quality,
      timestamp: Date.now()
    };

    // 2. Actualización de historiales
    this.state.history.spo2.push(data.spo2);
    this.state.history.ratio.push(data.ratio.value);
    this.state.history.perfusion.push(data.perfusion.value);
    this.state.history.quality.push(data.quality.overall);

    // 3. Mantenimiento de historiales
    if (this.state.history.spo2.length > 100) {
      this.state.history.spo2 = this.state.history.spo2.slice(-100);
      this.state.history.ratio = this.state.history.ratio.slice(-100);
      this.state.history.perfusion = this.state.history.perfusion.slice(-100);
      this.state.history.quality = this.state.history.quality.slice(-100);
    }

    // 4. Actualización de estabilidad
    this.updateStability(data.spo2);
  }

  /**
   * Gestión de recursos
   */
  public dispose(): void {
    try {
      // 1. Limpieza de procesadores
      this.ratioCalculator.dispose();
      this.calibrationCurve.dispose();
      this.perfusionAnalyzer.dispose();
      this.qualityAnalyzer.dispose();
      this.validator.dispose();

      // 2. Limpieza de buffers
      Object.values(this.buffers).forEach(buffer => {
        buffer.fill(0);
      });

      // 3. Limpieza de estado
      this.state.lastAnalysis = null;
      this.state.calibrationState = {
        curve: new Float64Array(3),
        temperature: 37.0,
        lastUpdate: 0
      };
      this.state.history = {
        spo2: [],
        ratio: [],
        perfusion: [],
        quality: []
      };
      this.state.stability = {
        window: new Float64Array(10),
        index: 0,
        value: 1.0
      };

    } catch (error) {
      console.error('Error in dispose:', error);
    }
  }
}
