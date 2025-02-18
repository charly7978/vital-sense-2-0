/ src/lib/config.ts

import type { SensitivitySettings, SystemConfig } from '@/types';

export const DEFAULT_SENSITIVITY: SensitivitySettings = {
  signalAmplification: 2.5,    // Amplificación de señal [1.0 - 5.0]
  noiseReduction: 1.8,         // Reducción de ruido [0.1 - 3.0]
  peakDetection: 1.2,          // Sensibilidad de detección de picos [0.5 - 2.0]
  heartbeatThreshold: 0.6,     // Umbral de latido [0.3 - 1.0]
  responseTime: 500,           // Tiempo de respuesta en ms
  signalStability: 0.85,       // Estabilidad requerida [0.0 - 1.0]
  brightness: 0.7,             // Brillo requerido [0.0 - 1.0]
  redIntensity: 0.6,          // Intensidad de rojo requerida [0.0 - 1.0]
  adaptiveThreshold: true,     // Umbral adaptativo
  autoCalibration: true,       // Calibración automática
  filterStrength: 7            // Fuerza del filtro [1 - 10]
};

export const SYSTEM_CONFIG: SystemConfig = {
  sampling: {
    rate: 30,           // Frecuencia de muestreo en Hz
    bufferSize: 1024,   // Tamaño del buffer circular
    windowSize: 256     // Tamaño de la ventana de análisis
  },
  filtering: {
    lowCutoff: 0.5,     // Frecuencia de corte inferior en Hz
    highCutoff: 4.0,    // Frecuencia de corte superior en Hz
    order: 4            // Orden del filtro
  },
  analysis: {
    minQuality: 0.3,    // Calidad mínima aceptable [0.0 - 1.0]
    peakDetectionSensitivity: 1.2,  // Sensibilidad [0.5 - 2.0]
    arrhythmiaThreshold: 0.7   // Umbral de arritmia [0.0 - 1.0]
  },
  calibration: {
    duration: 5000,     // Duración de calibración en ms
    minSamples: 150,    // Mínimo de muestras necesarias
    targetQuality: 0.7  // Calidad objetivo [0.0 - 1.0]
  }
};

// Constantes del sistema
export const CONSTANTS = {
  // Rangos fisiológicos
  NORMAL_BPM_RANGE: {
    min: 40,
    max: 200
  },
  NORMAL_SPO2_RANGE: {
    min: 90,
    max: 100
  },
  NORMAL_BP_RANGE: {
    systolic: {
      min: 90,
      max: 140
    },
    diastolic: {
      min: 60,
      max: 90
    }
  },

  // Umbrales de calidad
  QUALITY_THRESHOLDS: {
    excellent: 0.85,
    good: 0.70,
    fair: 0.50,
    poor: 0.30
  },

  // Tiempos
  TIMING: {
    minMeasurementTime: 5000,    // 5 segundos
    maxMeasurementTime: 60000,   // 1 minuto
    stabilizationTime: 2000,     // 2 segundos
    calibrationInterval: 300000,  // 5 minutos
    feedbackInterval: 200        // 200ms
  },

  // Audio
  AUDIO: {
    heartbeatFrequency: 880,     // Hz (A5)
    beepDuration: 50,            // ms
    minBeepInterval: 200         // ms
  },

  // Procesamiento de imagen
  IMAGE: {
    minBrightness: 0.2,
    maxBrightness: 0.9,
    minContrast: 0.15,
    regionOfInterestSize: 0.3,   // 30% del tamaño de la imagen
    motionThreshold: 0.3
  },

  // Análisis de señal
  SIGNAL: {
    minSNR: 5.0,                 // dB
    minStability: 0.7,
    maxMotion: 0.3,
    frequencyRange: {
      min: 0.5,                  // Hz
      max: 4.0                   // Hz
    }
  },

  // Pesos para métricas
  WEIGHTS: {
    snr: 0.25,
    stability: 0.20,
    motion: 0.15,
    brightness: 0.15,
    contrast: 0.15,
    frequency: 0.10
  }
};

// Mensajes de error y estado
export const MESSAGES = {
  errors: {
    noCamera: "No se pudo acceder a la cámara. Por favor, verifica los permisos.",
    lowLight: "La iluminación es insuficiente. Por favor, mejora la iluminación.",
    highMotion: "Demasiado movimiento detectado. Por favor, mantén el dedo más estable.",
    noFinger: "No se detecta el dedo. Por favor, coloca tu dedo sobre la cámara.",
    poorSignal: "Señal débil. Por favor, ajusta la posición del dedo.",
    calibrationFailed: "La calibración falló. Por favor, intenta nuevamente.",
    deviceError: "Error en el dispositivo. Por favor, recarga la página.",
    processingError: "Error en el procesamiento. Por favor, intenta nuevamente."
  },
  status: {
    calibrating: "Calibrando...",
    measuring: "Midiendo...",
    processing: "Procesando...",
    ready: "Listo para medir",
    stable: "Señal estable",
    unstable: "Estabilizando señal...",
    complete: "Medición completa"
  },
  instructions: {
    placement: "Coloca suavemente tu dedo sobre la cámara trasera",
    pressure: "Aplica una presión suave y constante",
    lighting: "Asegúrate de tener buena iluminación",
    stability: "Mantén el dedo y el dispositivo estables",
    patience: "La medición tomará unos segundos",
    retry: "Si la medición falla, intenta ajustando la posición del dedo"
  }
};

// Configuración de debug
export const DEBUG_CONFIG = {
  enabled: false,
  showFPS: false,
  showQuality: false,
  showRegions: false,
  logLevel: 'warn',
  metrics: {
    showSNR: false,
    showMotion: false,
    showStability: false,
    showSpectrum: false
  }
};

// Utilidades de configuración
export const configUtils = {
  validateSettings(settings: Partial<SensitivitySettings>): SensitivitySettings {
    return {
      ...DEFAULT_SENSITIVITY,
      ...Object.fromEntries(
        Object.entries(settings).map(([key, value]) => [
          key,
          clamp(
            value as number,
            getSettingRange(key as keyof SensitivitySettings).min,
            getSettingRange(key as keyof SensitivitySettings).max
          )
        ])
      )
    } as SensitivitySettings;
  },

  getOptimalSettings(deviceCapabilities: {
    hasHighPerformance: boolean;
    hasStableFrameRate: boolean;
    hasCameraControl: boolean;
  }): SensitivitySettings {
    const settings = { ...DEFAULT_SENSITIVITY };

    if (!deviceCapabilities.hasHighPerformance) {
      settings.filterStrength *= 0.7;
      settings.signalAmplification *= 1.2;
    }

    if (!deviceCapabilities.hasStableFrameRate) {
      settings.responseTime *= 1.2;
      settings.signalStability *= 0.9;
    }

    if (!deviceCapabilities.hasCameraControl) {
      settings.brightness *= 1.1;
      settings.redIntensity *= 1.1;
    }

    return settings;
  },

  updateSystemConfig(
    config: Partial<SystemConfig>,
    deviceCapabilities: {
      maxSampleRate: number;
      bufferSize: number;
    }
  ): SystemConfig {
    return {
      ...SYSTEM_CONFIG,
      ...config,
      sampling: {
        ...SYSTEM_CONFIG.sampling,
        rate: Math.min(
          config.sampling?.rate ?? SYSTEM_CONFIG.sampling.rate,
          deviceCapabilities.maxSampleRate
        ),
        bufferSize: Math.min(
          config.sampling?.bufferSize ?? SYSTEM_CONFIG.sampling.bufferSize,
          deviceCapabilities.bufferSize
        )
      }
    };
  }
};

// Funciones auxiliares
function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function getSettingRange(setting: keyof SensitivitySettings): { min: number; max: number } {
  const ranges: Record<keyof SensitivitySettings, { min: number; max: number }> = {
    signalAmplification: { min: 1.0, max: 5.0 },
    noiseReduction: { min: 0.1, max: 3.0 },
    peakDetection: { min: 0.5, max: 2.0 },
    heartbeatThreshold: { min: 0.3, max: 1.0 },
    responseTime: { min: 100, max: 1000 },
    signalStability: { min: 0.0, max: 1.0 },
    brightness: { min: 0.0, max: 1.0 },
    redIntensity: { min: 0.0, max: 1.0 },
    adaptiveThreshold: { min: 0, max: 1 },
    autoCalibration: { min: 0, max: 1 },
    filterStrength: { min: 1, max: 10 }
  };

  return ranges[setting];
}
