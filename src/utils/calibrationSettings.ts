
import { CalibrationSettings } from './types';

export const calibrationSettings: CalibrationSettings = {
  // Configuraciones de detección de señal
  MIN_RED_THRESHOLD: {
    value: 135,
    min: 100,  // Por debajo habría demasiados falsos positivos
    max: 200,  // Por encima sería demasiado restrictivo
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

  // Configuraciones de procesamiento de señal
  BUFFER_SIZE: {
    value: 60,
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
    value: 1.2,
    min: 0.5,  // Mínimo filtrado útil
    max: 2.0,  // Máximo antes de perder demasiada información
    step: 0.1, // Ajustes finos
    description: "Factor de reducción de ruido. Si lo subes, tienes señal más limpia pero podrías perder detalles. Si lo bajas, mantienes más detalles pero más ruido."
  },

  // Configuraciones de BPM
  BPM_SMOOTHING: {
    value: 0.7,
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
  },

  // Configuraciones adicionales de medición
  MEASUREMENT_DURATION: {
    value: 30000,
    min: 15000,  // Mínimo para obtener una medición útil
    max: 60000,  // Máximo práctico para una medición
    step: 1000,  // Ajustes en incrementos de 1 segundo
    description: "Duración de la medición en milisegundos. Si lo subes, obtienes más datos pero la medición tarda más. Si lo bajas, la medición es más rápida pero podrías perder precisión."
  },

  MIN_FRAMES_FOR_CALCULATION: {
    value: 30,
    min: 15,   // Mínimo para cálculos básicos
    max: 60,   // Máximo antes de introducir demasiada latencia
    step: 5,   // Ajustes en grupos de 5 frames
    description: "Frames mínimos necesarios para hacer cálculos. Si lo subes, los cálculos son más precisos pero necesitas esperar más. Si lo bajas, obtienes resultados más rápido pero menos precisos."
  },

  MIN_PEAKS_FOR_VALID_HR: {
    value: 5,
    min: 3,    // Mínimo absoluto para estimación de HR
    max: 10,   // Máximo práctico antes de demasiada latencia
    step: 1,   // Ajuste pico por pico
    description: "Picos mínimos necesarios para calcular ritmo cardíaco válido. Si lo subes, el HR será más preciso pero tardará más en mostrarse. Si lo bajas, verás el HR más rápido pero podría ser menos preciso."
  },

  PEAK_DISTANCE_MIN: {  // Renombrado para evitar duplicación
    value: 200,
    min: 150,  // Mínimo para evitar dobles detecciones
    max: 400,  // Máximo para no perder picos reales
    step: 10,  // Ajustes en incrementos de 10ms
    description: "Distancia mínima entre picos en ms. Si lo subes, evitas falsos positivos pero podrías perder latidos rápidos. Si lo bajas, detectas latidos más rápidos pero arriesgas detectar rebotes."
  },

  PEAK_DISTANCE_MAX: {
    value: 2000,
    min: 1000, // Mínimo para bradicardias moderadas
    max: 3000, // Máximo absoluto para cualquier ritmo viable
    step: 100, // Ajustes en incrementos de 100ms
    description: "Distancia máxima entre picos en ms. Si lo subes, puedes detectar bradicardias severas pero arriesgas falsos negativos. Si lo bajas, evitas perderte picos pero podrías no detectar bradicardias."
  },

  PEAK_THRESHOLD_FACTOR: {
    value: 0.5,
    min: 0.2,  // Mínimo para detección básica
    max: 0.8,  // Máximo antes de perder demasiados picos
    step: 0.05,// Ajustes finos
    description: "Factor para calcular umbral de picos. Si lo subes, solo detecta picos más prominentes pero más seguros. Si lo bajas, detecta más picos pero algunos podrían ser ruido."
  },

  MIN_RED_VALUE: {
    value: 150,
    min: 100,  // Mínimo para señal útil
    max: 200,  // Máximo antes de ser demasiado restrictivo
    step: 5,   // Ajustes en incrementos de 5 unidades
    description: "Valor mínimo de componente roja para considerar píxel válido. Si lo subes, la detección es más exigente pero más segura. Si lo bajas, detecta más fácilmente pero podría dar falsos positivos."
  },

  MIN_RED_DOMINANCE: {
    value: 1.5,
    min: 1.2,  // Mínimo para asegurar dominancia roja
    max: 2.0,  // Máximo práctico
    step: 0.1, // Ajustes finos
    description: "Factor mínimo de dominancia del canal rojo. Si lo subes, aseguras mejor detección de sangre pero requiere mejor iluminación. Si lo bajas, funciona con peor iluminación pero podría detectar falsos positivos."
  },

  MIN_VALID_PIXELS_RATIO: {
    value: 0.3,
    min: 0.1,  // Mínimo para medición viable
    max: 0.5,  // Máximo práctico
    step: 0.05,// Ajustes en pasos de 5%
    description: "Proporción mínima de píxeles válidos. Si lo subes, aseguras mejor calidad pero requiere mejor posicionamiento. Si lo bajas, es más tolerante pero podría dar lecturas menos precisas."
  },

  MIN_BRIGHTNESS: {
    value: 50,
    min: 30,   // Mínimo para detección básica
    max: 80,   // Máximo antes de saturación
    step: 5,   // Ajustes en incrementos de 5 unidades
    description: "Brillo mínimo necesario. Si lo subes, requiere mejor iluminación pero da señal más limpia. Si lo bajas, funciona con menos luz pero podría tener más ruido."
  },

  MIN_VALID_READINGS: {
    value: 10,
    min: 5,    // Mínimo para estadística básica
    max: 20,   // Máximo antes de demasiada latencia
    step: 1,   // Ajuste lectura por lectura
    description: "Lecturas válidas mínimas necesarias. Si lo subes, obtienes promedios más estables pero tarda más. Si lo bajas, responde más rápido pero podría ser más variable."
  },

  FINGER_DETECTION_DELAY: {
    value: 1000,
    min: 500,  // Mínimo para evitar falsos positivos
    max: 2000, // Máximo antes de ser molesto
    step: 100, // Ajustes en incrementos de 100ms
    description: "Tiempo en ms para confirmar detección de dedo. Si lo subes, evitas falsas detecciones pero la respuesta es más lenta. Si lo bajas, responde más rápido pero podría dar falsos positivos."
  },

  MIN_SPO2: {
    value: 80,
    min: 70,   // Mínimo absoluto viable
    max: 90,   // Máximo antes de perder detecciones válidas
    step: 1,   // Ajustes punto por punto
    description: "SpO2 mínimo considerado válido. Si lo subes, solo aceptas lecturas más seguras pero podrías perder algunas válidas. Si lo bajas, detectas más casos pero podrías incluir errores."
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
