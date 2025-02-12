
import { CalibrationSettings } from './types';

export const calibrationSettings: CalibrationSettings = {
  // Configuraciones de detección de señal
  MIN_RED_THRESHOLD: {
    value: 565,
    min: 120,  // Por debajo habría demasiados falsos positivos
    max: 400,  // Por encima sería demasiado restrictivo
    step: 5,   // Ajustes en incrementos de 5 para cambios notables pero no bruscos
    description: "Umbral mínimo de componente roja para detectar dedo. Si lo subes, el sistema será más exigente para detectar un dedo (menos falsos positivos). Si lo bajas, será más sensible pero podría dar falsos positivos."
  },
  
  SIGNAL_AMPLIFICATION: {
    value: 2.0,
    min: 0.5,  // Por debajo la señal sería demasiado débil para ser útil
    max: 5.0,  // Por encima la señal se saturaría demasiado
    step: 0.1, // Paso pequeño permite ajustes finos
    description: "Amplificación de la señal PPG. Si lo subes, la señal será más fuerte pero podrías saturarla. Si lo bajas, la señal será más débil pero más estable."
  },

  // Configuraciones de detección de picos
  PEAK_THRESHOLD: {
    value: 0.15,
    min: 0.05, // Por debajo detectaría demasiado ruido
    max: 0.5,  // Por encima perdería muchos picos válidos
    step: 0.01, // Ajustes muy finos para calibración precisa
    description: "Umbral para detectar picos. Si lo subes, detectará menos picos pero más seguros. Si lo bajas, detectará más picos pero algunos podrían ser falsos."
  },

  MIN_PEAK_DISTANCE: {
    value: 250,
    min: 150,  // Mínimo valor seguro para captar incluso taquicardias
    max: 500,  // Máximo valor seguro para no perder bradicardias
    step: 10,  // Ajustes en pasos de 10ms para cambios significativos
    description: "Distancia mínima entre picos en ms. Si lo subes, evitas dobles detecciones pero podrías perder latidos rápidos. Si lo bajas, captas latidos más rápidos pero arriesgas dobles detecciones."
  },

  // Configuraciones de procesamiento de señal
  BUFFER_SIZE: {
    value: 40,
    min: 30,   // Mínimo necesario para análisis válido
    max: 120,  // Máximo práctico antes de que la latencia sea problemática
    step: 5,   // Ajustes en grupos de 5 frames
    description: "Tamaño del buffer de señal. Si lo subes, tienes más datos para análisis pero más latencia. Si lo bajas, tienes respuesta más rápida pero menos precisión."
  },

  WINDOW_SIZE: {
    value: 90,
    min: 45,   // Mínimo para análisis confiable
    max: 180,  // Máximo antes de que la latencia sea excesiva
    step: 15,  // Ajustes en incrementos significativos
    description: "Tamaño de la ventana de análisis. Si lo subes, obtienes análisis más estables pero más lentos. Si lo bajas, tienes respuesta más rápida pero más variable."
  },

  // Configuraciones de calidad
  QUALITY_THRESHOLD: {
    value: 0.15,
    min: 0.05, // Mínimo para mediciones útiles
    max: 0.5,  // Máximo práctico antes de rechazar demasiadas mediciones
    step: 0.05, // Ajustes moderados
    description: "Umbral de calidad de señal. Si lo subes, solo aceptas señales muy buenas pero tienes menos mediciones. Si lo bajas, tienes más mediciones pero algunas podrían ser menos precisas."
  },

  // Configuraciones de filtrado
  NOISE_REDUCTION: {
    value: 2.9,
    min: 0.5,  // Mínimo filtrado útil
    max: 2.0,  // Máximo antes de perder demasiada información
    step: 0.1, // Ajustes finos
    description: "Factor de reducción de ruido. Si lo subes, tienes señal más limpia pero podrías perder detalles. Si lo bajas, mantienes más detalles pero más ruido."
  },

  // Configuraciones de BPM
  BPM_SMOOTHING: {
    value: 1.1,
    min: 0.3,  // Mínimo para mantener algo de estabilidad
    max: 0.9,  // Máximo antes de volverse demasiado lento
    step: 0.05, // Ajustes finos
    description: "Factor de suavizado de BPM. Si lo subes, las lecturas son más estables pero menos reactivas. Si lo bajas, son más reactivas pero más variables."
  },

  // Configuraciones de SpO2
  SPO2_CALIBRATION: {
    value: 1.0,
    min: 0.8,  // Mínimo para lecturas realistas
    max: 1.2,  // Máximo para lecturas realistas
    step: 0.05, // Ajustes finos
    description: "Factor de calibración de SpO2. Si lo subes, las lecturas de SpO2 serán más altas. Si lo bajas, serán más bajas."
  },

  // Configuraciones de estabilidad
  STABILITY_THRESHOLD: {
    value: 4,
    min: 2,    // Mínimo para detección útil
    max: 8,    // Máximo antes de volverse demasiado lento
    step: 1,   // Ajustes frame por frame
    description: "Frames necesarios para confirmar estabilidad. Si lo subes, la detección es más robusta pero más lenta. Si lo bajas, es más rápida pero menos segura."
  },

  // Configuraciones de reset
  RESET_DELAY: {
    value: 1000,
    min: 500,  // Mínimo para evitar resets prematuros
    max: 2000, // Máximo antes de mantener valores obsoletos
    step: 100, // Ajustes en incrementos de 100ms
    description: "Tiempo en ms antes de resetear valores sin dedo. Si lo subes, mantiene valores más tiempo. Si lo bajas, resetea más rápido."
  },

  // Configuraciones de frecuencia
  MIN_PROCESSING_INTERVAL: {
    value: 33,
    min: 16,   // Mínimo para 60fps
    max: 66,   // Máximo para 15fps
    step: 1,   // Ajustes finos por ms
    description: "Intervalo mínimo entre procesamientos en ms. Si lo subes, usa menos CPU pero toma menos muestras. Si lo bajas, toma más muestras pero usa más CPU."
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
