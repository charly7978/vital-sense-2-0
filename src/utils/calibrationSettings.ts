import { CalibrationSettings } from './types';
import { supabase } from "@/integrations/supabase/client";

export const calibrationSettings: CalibrationSettings = {
  // Configuraciones de detección de señal
  MIN_RED_THRESHOLD: {
    value: 135,
    min: 100,
    max: 200,
    step: 5,
    description: "Umbral mínimo de componente roja para detectar dedo. Si lo subes, el sistema será más exigente para detectar un dedo (menos falsos positivos). Si lo bajas, será más sensible pero podría dar falsos positivos."
  },
  
  SIGNAL_AMPLIFICATION: {
    value: 2.0,
    min: 0.5,
    max: 5.0,
    step: 0.1,
    description: "Amplificación de la señal PPG. Si lo subes, la señal será más fuerte pero podrías saturarla. Si lo bajas, la señal será más débil pero más estable."
  },

  // Configuraciones de detección de picos
  PEAK_THRESHOLD: {
    value: 0.15,
    min: 0.05,
    max: 0.5,
    step: 0.01,
    description: "Umbral para detectar picos. Si lo subes, detectará menos picos pero más seguros. Si lo bajas, detectará más picos pero algunos podrían ser falsos."
  },

  MIN_PEAK_DISTANCE: {
    value: 250,
    min: 150,
    max: 500,
    step: 10,
    description: "Distancia mínima entre picos en ms. Si lo subes, evitas dobles detecciones pero podrías perder latidos rápidos. Si lo bajas, captas latidos más rápidos pero arriesgas dobles detecciones."
  },

  // Configuraciones de procesamiento de señal
  BUFFER_SIZE: {
    value: 40, // Reducido de 60 a 40 para respuesta más rápida
    min: 30,
    max: 120,
    step: 5,
    description: "Tamaño del buffer de señal. Si lo subes, tienes más datos para análisis pero más latencia. Si lo bajas, tienes respuesta más rápida pero menos precisión."
  },

  WINDOW_SIZE: {
    value: 60, // Reducido de 90 a 60 para respuesta más rápida
    min: 45,
    max: 180,
    step: 15,
    description: "Tamaño de la ventana de análisis. Si lo subes, obtienes análisis más estables pero más lentos. Si lo bajas, tienes respuesta más rápida pero más variable."
  },

  // Configuraciones de calidad
  QUALITY_THRESHOLD: {
    value: 0.15,
    min: 0.05,
    max: 0.5,
    step: 0.05,
    description: "Umbral de calidad de señal. Si lo subes, solo aceptas señales muy buenas pero tienes menos mediciones. Si lo bajas, tienes más mediciones pero algunas podrían ser menos precisas."
  },

  // Configuraciones de filtrado
  NOISE_REDUCTION: {
    value: 1.0, // Reducido de 1.2 a 1.0 para mejor detección
    min: 0.5,
    max: 2.0,
    step: 0.1,
    description: "Factor de reducción de ruido. Si lo subes, tienes señal más limpia pero podrías perder detalles. Si lo bajas, mantienes más detalles pero más ruido."
  },

  // Configuraciones de BPM
  BPM_SMOOTHING: {
    value: 0.7,
    min: 0.3,
    max: 0.9,
    step: 0.05,
    description: "Factor de suavizado de BPM. Si lo subes, las lecturas son más estables pero menos reactivas. Si lo bajas, son más reactivas pero más variables."
  },

  // Configuraciones de SpO2
  SPO2_CALIBRATION: {
    value: 1.0,
    min: 0.8,
    max: 1.2,
    step: 0.05,
    description: "Factor de calibración de SpO2. Si lo subes, las lecturas de SpO2 serán más altas. Si lo bajas, serán más bajas."
  },

  // Configuraciones de estabilidad
  STABILITY_THRESHOLD: {
    value: 4,
    min: 2,
    max: 8,
    step: 1,
    description: "Frames necesarios para confirmar estabilidad. Si lo subes, la detección es más robusta pero más lenta. Si lo bajas, es más rápida pero menos segura."
  },

  // Configuraciones de reset
  RESET_DELAY: {
    value: 1000,
    min: 500,
    max: 2000,
    step: 100,
    description: "Tiempo en ms antes de resetear valores sin dedo. Si lo subes, mantiene valores más tiempo. Si lo bajas, resetea más rápido."
  },

  // Configuraciones de frecuencia
  MIN_PROCESSING_INTERVAL: {
    value: 33,
    min: 16,
    max: 66,
    step: 1,
    description: "Intervalo mínimo entre procesamientos en ms. Si lo subes, usa menos CPU pero toma menos muestras. Si lo bajas, toma más muestras pero usa más CPU."
  },

  // Configuraciones adicionales
  MEASUREMENT_DURATION: {
    value: 30000,
    min: 10000,
    max: 60000,
    step: 1000,
    description: "Duración total de la medición en milisegundos"
  },

  MIN_FRAMES_FOR_CALCULATION: {
    value: 30,
    min: 15,
    max: 60,
    step: 5,
    description: "Cantidad mínima de frames necesarios para iniciar cálculos"
  },

  MIN_PEAKS_FOR_VALID_HR: {
    value: 3,
    min: 2,
    max: 5,
    step: 1,
    description: "Cantidad mínima de picos necesarios para considerar válido el ritmo cardíaco"
  },

  MAX_PEAK_DISTANCE: {
    value: 1500,
    min: 1000,
    max: 2000,
    step: 100,
    description: "Distancia máxima permitida entre picos en milisegundos"
  },

  PEAK_THRESHOLD_FACTOR: {
    value: 0.5,
    min: 0.3,
    max: 0.7,
    step: 0.05,
    description: "Factor multiplicador para el umbral de detección de picos"
  },

  MIN_RED_VALUE: {
    value: 100,
    min: 50,
    max: 150,
    step: 5,
    description: "Valor mínimo del canal rojo para considerar válida la señal"
  },

  MIN_RED_DOMINANCE: {
    value: 1.2,
    min: 1.1,
    max: 1.5,
    step: 0.05,
    description: "Factor mínimo de dominancia del canal rojo sobre otros canales"
  },

  MIN_VALID_PIXELS_RATIO: {
    value: 0.8,
    min: 0.6,
    max: 0.9,
    step: 0.05,
    description: "Proporción mínima de píxeles válidos en el área de interés"
  },

  MIN_BRIGHTNESS: {
    value: 50,
    min: 30,
    max: 70,
    step: 5,
    description: "Nivel mínimo de brillo necesario para mediciones válidas"
  },

  MIN_VALID_READINGS: {
    value: 10,
    min: 5,
    max: 20,
    step: 1,
    description: "Cantidad mínima de lecturas válidas necesarias"
  },

  FINGER_DETECTION_DELAY: {
    value: 500,
    min: 200,
    max: 1000,
    step: 100,
    description: "Tiempo de espera en ms antes de confirmar la detección del dedo"
  },

  MIN_SPO2: {
    value: 90,
    min: 85,
    max: 95,
    step: 1,
    description: "Valor mínimo de SpO2 considerado válido"
  }
};

let loadedSettings = false;

export const loadCalibrationSettings = async () => {
  if (loadedSettings) return;

  try {
    const { data: pattern, error } = await supabase
      .from('calibration_patterns')
      .select('*')
      .eq('name', 'Default Pattern')
      .single();

    if (error) throw error;

    if (pattern) {
      Object.entries(pattern).forEach(([key, value]) => {
        if (typeof value === 'object' && value !== null && 'value' in value) {
          const settingKey = key.toUpperCase();
          if (settingKey in calibrationSettings) {
            // Asegurarnos de que el valor sea numérico
            const numericValue = typeof value.value === 'string' ? 
              parseFloat(value.value) : 
              Number(value.value);
              
            if (!isNaN(numericValue)) {
              calibrationSettings[settingKey as keyof CalibrationSettings].value = numericValue;
            } else {
              console.warn(`Valor inválido para ${key}:`, value.value);
            }
          }
        }
      });
      loadedSettings = true;
      console.log('Configuraciones de calibración cargadas');
    }
  } catch (error) {
    console.error('Error cargando configuraciones:', error);
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
