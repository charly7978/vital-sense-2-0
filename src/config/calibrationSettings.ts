
/**
 * Configuraciones de Calibración del Sistema PPG
 * Estos valores pueden ser ajustados para calibrar el sistema
 */

export const CalibrationConfig = {
  // Configuraciones de Detección de Señal
  signal: {
    minRedValue: 20,           // Valor mínimo del componente rojo para detección del dedo
    minBrightness: 80,         // Brillo mínimo requerido
    minValidPixelsRatio: 0.2,  // Ratio mínimo de píxeles válidos
    signalAmplification: 1.5,  // Factor de amplificación de la señal
    noiseReduction: 1.2,       // Factor de reducción de ruido
    baselineCorrection: 0.8    // Factor de corrección de línea base
  },

  // Configuraciones de Detección de Picos
  peaks: {
    minPeakDistance: 400,      // Distancia mínima entre picos (ms)
    maxPeakDistance: 1200,     // Distancia máxima entre picos (ms)
    peakThreshold: 0.4,        // Umbral para detección de picos
    minPeakHeight: 0.3,        // Altura mínima para considerar un pico válido
    maxPeakWidth: 200,         // Ancho máximo de pico aceptable (ms)
    peakProminence: 0.2        // Prominencia mínima para picos
  },

  // Configuraciones de Medición
  measurement: {
    duration: 30,              // Duración de la medición (segundos)
    minReadingsRequired: 30,   // Mínimo de lecturas requeridas
    maxReadingsStored: 300,    // Máximo de lecturas almacenadas
    qualityThreshold: 0.3,     // Umbral de calidad de señal
    stabilizationTime: 5       // Tiempo de estabilización inicial (segundos)
  },

  // Configuraciones de Cálculo de Signos Vitales
  vitals: {
    // Frecuencia Cardíaca (BPM)
    bpm: {
      min: 40,                 // BPM mínimo válido
      max: 200,                // BPM máximo válido
      averagingWindow: 5       // Ventana de promediado (segundos)
    },
    
    // SpO2
    spo2: {
      calibrationFactor: 1.02, // Factor de calibración SpO2
      minValid: 80,            // SpO2 mínimo válido
      maxValid: 100,           // SpO2 máximo válido
      redIrRatio: 0.4         // Ratio R/IR para calibración
    },

    // Presión Arterial
    bloodPressure: {
      systolicFactor: 2.5,     // Factor de calibración sistólica
      diastolicFactor: 1.8,    // Factor de calibración diastólica
      pttScaleFactor: 0.9,     // Factor de escala para PTT
      baselineAdjustment: 1.1  // Ajuste de línea base
    }
  },

  // Configuraciones de Análisis de Señal
  analysis: {
    // Filtros
    filters: {
      lowPassCutoff: 5,        // Frecuencia de corte paso bajo (Hz)
      highPassCutoff: 0.5,     // Frecuencia de corte paso alto (Hz)
      notchFrequency: 50,      // Frecuencia de filtro notch (Hz)
      filterOrder: 4           // Orden de los filtros
    },

    // Análisis Espectral
    spectral: {
      fftWindowSize: 256,      // Tamaño de ventana FFT
      samplingRate: 30,        // Tasa de muestreo (Hz)
      minFrequency: 0.5,       // Frecuencia mínima de interés (Hz)
      maxFrequency: 4.0        // Frecuencia máxima de interés (Hz)
    },

    // Detección de Arritmias
    arrhythmia: {
      rrVariabilityThreshold: 0.2,  // Umbral de variabilidad RR
      prematureBeatsThreshold: 0.15, // Umbral para latidos prematuros
      minConsecutiveBeats: 3        // Mínimo de latidos consecutivos para análisis
    }
  },

  // Configuraciones de Control de Calidad
  quality: {
    signalToNoiseRatio: 3.0,   // Ratio señal/ruido mínimo aceptable
    motionTolerance: 0.3,      // Tolerancia a movimiento
    baselineStability: 0.8,    // Estabilidad mínima de línea base
    artifactThreshold: 0.25    // Umbral para detección de artefactos
  }
};
