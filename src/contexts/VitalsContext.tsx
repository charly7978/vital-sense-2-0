import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { UltraAdvancedPPGProcessor } from '../utils/UltraAdvancedPPGProcessor';
import { useToast } from "@/hooks/use-toast";
import type { VitalReading, SensitivitySettings } from '../utils/types';

interface VitalsContextType {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  hasArrhythmia: boolean;
  arrhythmiaType: string;
  readings: VitalReading[];
  isProcessing: boolean;
  isStarted: boolean;
  measurementProgress: number;
  measurementQuality: number;
  sensitivitySettings: SensitivitySettings;
  toggleMeasurement: () => void;
  resetMeasurement: () => void;
  processFrame: (imageData: ImageData) => void;
  updateSensitivitySettings: (settings: SensitivitySettings) => void;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

const beepPlayer = new BeepPlayer();
const ppgProcessor = new UltraAdvancedPPGProcessor();

const MEASUREMENT_DURATION = 30;

export const VitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bpm, setBpm] = useState<number>(0);
  const [spo2, setSpo2] = useState<number>(0);
  const [systolic, setSystolic] = useState<number>(0);
  const [diastolic, setDiastolic] = useState<number>(0);
  const [hasArrhythmia, setHasArrhythmia] = useState<boolean>(false);
  const [arrhythmiaType, setArrhythmiaType] = useState<string>('Normal');
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [measurementProgress, setMeasurementProgress] = useState(0);
  const [measurementQuality, setMeasurementQuality] = useState(0);
  const [measurementStartTime, setMeasurementStartTime] = useState<number | null>(null);
  const lastProcessedTime = useRef<number>(0);
  const processingInterval = 33; // ~30fps

  const [sensitivitySettings, setSensitivitySettings] = useState<SensitivitySettings>({
    signalAmplification: 1.5,
    noiseReduction: 1.2,
    peakDetection: 1.3,
    heartbeatThreshold: 0.5,
    responseTime: 1.0,
    signalStability: 0.5,
    brightness: 1.0,
    redIntensity: 1.0
  });

  const { toast } = useToast();

  const updateSensitivitySettings = useCallback((settings: SensitivitySettings) => {
    setSensitivitySettings(settings);
    ppgProcessor.updateSensitivitySettings(settings);
  }, []);

  const resetMeasurements = useCallback(() => {
    setBpm(0);
    setSpo2(0);
    setSystolic(0);
    setDiastolic(0);
    setHasArrhythmia(false);
    setArrhythmiaType('Normal');
    setReadings([]);
    setMeasurementProgress(0);
    setMeasurementQuality(0);
  }, []);

  const resetMeasurement = useCallback(() => {
    resetMeasurements();
    if (isStarted) {
      setIsStarted(false);
      setMeasurementStartTime(null);
    }
    toast({
      title: "Medición reiniciada",
      description: "Los valores han sido reiniciados."
    });
  }, [isStarted, resetMeasurements, toast]);

  const processFrame = useCallback(async (imageData: ImageData) => {
    if (!isStarted) {
      console.log('[PPG] Medición no iniciada, ignorando frame');
      return;
    }

    const currentTime = Date.now();
    if (currentTime - lastProcessedTime.current < processingInterval) {
      console.log('[PPG] Frame ignorado por intervalo mínimo no cumplido:', {
        currentTime,
        lastProcessed: lastProcessedTime.current,
        diff: currentTime - lastProcessedTime.current,
        minInterval: processingInterval
      });
      return;
    }
    lastProcessedTime.current = currentTime;

    console.log('[PPG] Iniciando procesamiento de frame:', {
      width: imageData.width,
      height: imageData.height,
      timestamp: currentTime
    });

    try {
      setIsProcessing(true);
      console.log('[PPG] Enviando frame a procesador PPG');
      const processedSignal = await ppgProcessor.processFrame(imageData);
      console.log('[PPG] Señal procesada:', processedSignal);
      
      // Actualizar lecturas en tiempo real
      const newReading: VitalReading = {
        timestamp: processedSignal.timestamp,
        value: processedSignal.signal[0] || 0
      };

      console.log('[PPG] Nueva lectura:', newReading);
      setReadings(prev => [...prev.slice(-100), newReading]);
      
      // Actualizar métricas vitales
      if (processedSignal.bpm > 40 && processedSignal.bpm < 200) {
        console.log('[PPG] BPM válido detectado:', processedSignal.bpm);
        setBpm(Math.round(processedSignal.bpm));
      } else {
        console.log('[PPG] BPM fuera de rango:', processedSignal.bpm);
      }

      // Actualizar SpO2
      if (processedSignal.spo2 > 0) {
        console.log('[PPG] SpO2 válido detectado:', processedSignal.spo2);
        setSpo2(processedSignal.spo2);
      } else {
        console.log('[PPG] SpO2 inválido:', processedSignal.spo2);
      }

      // Actualizar presión arterial
      if (processedSignal.systolic > 0 && processedSignal.diastolic > 0) {
        console.log('[PPG] Presión arterial válida:', {
          systolic: processedSignal.systolic,
          diastolic: processedSignal.diastolic
        });
        setSystolic(processedSignal.systolic);
        setDiastolic(processedSignal.diastolic);
      } else {
        console.log('[PPG] Presión arterial inválida:', {
          systolic: processedSignal.systolic,
          diastolic: processedSignal.diastolic
        });
      }

      // Actualizar calidad de la señal
      const quality = Math.min(1, Math.max(0, processedSignal.quality));
      console.log('[PPG] Calidad de señal:', {
        raw: processedSignal.quality,
        normalized: quality,
        settings: sensitivitySettings
      });
      setMeasurementQuality(quality);

      // Analizar detección de dedo
      if (quality < 0.15) {
        console.log('[PPG] No se detecta dedo en la cámara');
      } else if (quality < 0.3) {
        console.log('[PPG] Dedo detectado pero señal muy débil');
      } else if (quality < 0.6) {
        console.log('[PPG] Dedo detectado, señal regular');
      } else {
        console.log('[PPG] Dedo detectado, señal óptima');
      }

      // Actualizar estado de arritmia
      console.log('[PPG] Estado de arritmia:', {
        hasArrhythmia: processedSignal.hasArrhythmia,
        type: processedSignal.arrhythmiaType
      });
      setHasArrhythmia(processedSignal.hasArrhythmia);
      setArrhythmiaType(processedSignal.arrhythmiaType);

      // Mostrar feedback de calidad si es muy baja
      if (quality < 0.3 && isStarted) {
        console.log('[PPG] Enviando alerta de calidad baja');
        toast({
          title: "Calidad de señal baja",
          description: "Por favor, ajuste la posición de su dedo",
          variant: "destructive"
        });
      }

      setIsProcessing(false);
      console.log('[PPG] Frame procesado completamente');
    } catch (error) {
      console.error('[PPG] Error procesando frame:', error);
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Error en el procesamiento",
        description: "Error al procesar la imagen de la cámara."
      });
    }
  }, [isStarted, toast, sensitivitySettings]);

  const toggleMeasurement = useCallback(() => {
    console.log('[PPG] Toggling medición:', {
      estadoActual: isStarted,
      nuevoEstado: !isStarted
    });

    if (isStarted) {
      console.log('[PPG] Deteniendo medición');
      setIsStarted(false);
      setMeasurementStartTime(null);
      resetMeasurements();
    } else {
      console.log('[PPG] Iniciando medición');
      resetMeasurements();
      setIsStarted(true);
      setMeasurementStartTime(Date.now());
      toast({
        title: "Iniciando medición",
        description: "Por favor, mantenga su dedo frente a la cámara."
      });
    }
  }, [isStarted, toast, resetMeasurements]);

  React.useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStarted && measurementStartTime) {
      console.log('[PPG] Iniciando temporizador de medición');
      interval = setInterval(() => {
        const elapsed = (Date.now() - measurementStartTime) / 1000;
        const progress = Math.min((elapsed / MEASUREMENT_DURATION) * 100, 100);
        console.log('[PPG] Progreso de medición:', {
          elapsed,
          progress,
          measurementStartTime
        });
        setMeasurementProgress(progress);

        if (elapsed >= MEASUREMENT_DURATION) {
          console.log('[PPG] Medición completada por tiempo');
          setIsStarted(false);
          toast({
            title: "Medición completada",
            description: "La medición se ha completado exitosamente."
          });
        }
      }, 100);
    }

    return () => {
      if (interval) {
        console.log('[PPG] Limpiando temporizador de medición');
        clearInterval(interval);
      }
    };
  }, [isStarted, measurementStartTime, toast]);

  const value = {
    bpm,
    spo2,
    systolic,
    diastolic,
    hasArrhythmia,
    arrhythmiaType,
    readings,
    isProcessing,
    isStarted,
    measurementProgress,
    measurementQuality,
    sensitivitySettings,
    toggleMeasurement,
    resetMeasurement,
    processFrame,
    updateSensitivitySettings
  };

  return <VitalsContext.Provider value={value}>{children}</VitalsContext.Provider>;
};

export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (context === undefined) {
    throw new Error('useVitals must be used within a VitalsProvider');
  }
  return context;
};
