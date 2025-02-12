
import { CalibrationSettings } from './types';

export const calibrationSettings: CalibrationSettings = {
  // Configuraciones de detección de señal
  MIN_RED_THRESHOLD: {
    value: 135,
    min: 100,
    max: 200,
    step: 5,
    description: "Umbral mínimo de componente roja para detectar dedo. Aumentar si hay falsos positivos, disminuir si no detecta el dedo."
  },
  
  SIGNAL_AMPLIFICATION: {
    value: 2.0,
    min: 0.5,
    max: 5.0,
    step: 0.1,
    description: "Amplificación de la señal PPG. Aumentar si la señal es débil, disminuir si está saturada."
  },

  // Configuraciones de detección de picos
  PEAK_THRESHOLD: {
    value: 0.15,
    min: 0.05,
    max: 0.5,
    step: 0.01,
    description: "Umbral para detectar picos. Aumentar para reducir falsos positivos, disminuir para detectar picos más sutiles."
  },

  MIN_PEAK_DISTANCE: {
    value: 250,
    min: 150,
    max: 500,
    step: 10,
    description: "Distancia mínima entre picos en ms. Aumentar para evitar dobles detecciones, disminuir para capturar ritmos cardíacos más altos."
  },

  // Configuraciones de procesamiento de señal
  BUFFER_SIZE: {
    value: 60,
    min: 30,
    max: 120,
    step: 5,
    description: "Tamaño del buffer de señal. Aumentar para más estabilidad pero más latencia, disminuir para respuesta más rápida."
  },

  WINDOW_SIZE: {
    value: 90,
    min: 45,
    max: 180,
    step: 15,
    description: "Tamaño de la ventana de análisis. Aumentar para más precisión pero más latencia, disminuir para respuesta más rápida."
  },

  // Configuraciones de calidad
  QUALITY_THRESHOLD: {
    value: 0.15,
    min: 0.05,
    max: 0.5,
    step: 0.05,
    description: "Umbral de calidad de señal. Aumentar para mediciones más precisas pero menos frecuentes, disminuir para más mediciones pero menos precisas."
  },

  // Configuraciones de filtrado
  NOISE_REDUCTION: {
    value: 1.2,
    min: 0.5,
    max: 2.0,
    step: 0.1,
    description: "Factor de reducción de ruido. Aumentar para señal más limpia pero posible pérdida de detalles, disminuir para más detalles pero más ruido."
  },

  // Configuraciones de BPM
  BPM_SMOOTHING: {
    value: 0.7,
    min: 0.3,
    max: 0.9,
    step: 0.05,
    description: "Factor de suavizado de BPM. Aumentar para lecturas más estables pero menos reactivas, disminuir para más reactividad pero más variación."
  },

  // Configuraciones de SpO2
  SPO2_CALIBRATION: {
    value: 1.0,
    min: 0.8,
    max: 1.2,
    step: 0.05,
    description: "Factor de calibración de SpO2. Ajustar según mediciones de referencia. Mayor valor = lecturas más altas."
  },

  // Configuraciones de estabilidad
  STABILITY_THRESHOLD: {
    value: 4,
    min: 2,
    max: 8,
    step: 1,
    description: "Frames necesarios para confirmar estabilidad. Aumentar para detección más robusta pero más lenta, disminuir para respuesta más rápida."
  },

  // Configuraciones de reset
  RESET_DELAY: {
    value: 1000,
    min: 500,
    max: 2000,
    step: 100,
    description: "Tiempo en ms antes de resetear valores sin dedo. Aumentar para más persistencia, disminuir para reset más rápido."
  },

  // Configuraciones de frecuencia
  MIN_PROCESSING_INTERVAL: {
    value: 33,
    min: 16,
    max: 66,
    step: 1,
    description: "Intervalo mínimo entre procesamientos en ms. Aumentar para menor uso de CPU, disminuir para más muestras por segundo."
  }
};

export const getCalibrationValue = (key: keyof typeof calibrationSettings): number => {
  return calibrationSettings[key].value;
};

export const setCalibrationValue = (key: keyof typeof calibrationSettings, value: number): void => {
  if (value >= calibrationSettings[key].min && value <= calibrationSettings[key].max) {
    calibrationSettings[key].value = value;
    console.log(`Calibración actualizada - ${key}:`, value);
  } else {
    console.warn(`Valor fuera de rango para ${key}:`, value);
  }
};

export const getCalibrationInfo = (key: keyof typeof calibrationSettings) => {
  return {
    ...calibrationSettings[key],
    key
  };
};

export const getAllCalibrationInfo = () => {
  return Object.entries(calibrationSettings).map(([key, value]) => ({
    key,
    ...value
  }));
};
