import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { UltraAdvancedPPGProcessor } from '../utils/UltraAdvancedPPGProcessor';
import { useToast } from "@/hooks/use-toast";
import type { VitalReading, SensitivitySettings, ProcessedSignal } from '../utils/types';

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

const ppgProcessor = new UltraAdvancedPPGProcessor('signalCanvas', 'qualityIndicator');
const beepPlayer = new BeepPlayer();

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
      console.log('[PPG] Frame ignorado por intervalo mínimo no cumplido');
      return;
    }
    lastProcessedTime.current = currentTime;

    try {
      setIsProcessing(true);
      console.log('[PPG] Enviando frame a procesador PPG');
      const processedSignal = await ppgProcessor.processFrame(imageData);
      console.log('[PPG] Señal procesada:', processedSignal);
      
      // Actualizar todas las métricas vitales
      if (processedSignal.bpm) setBpm(processedSignal.bpm);
      if (processedSignal.spo2) setSpo2(processedSignal.spo2);
      if (processedSignal.systolic) setSystolic(processedSignal.systolic);
      if (processedSignal.diastolic) setDiastolic(processedSignal.diastolic);
      if (processedSignal.hasArrhythmia !== undefined) setHasArrhythmia(processedSignal.hasArrhythmia);
      if (processedSignal.arrhythmiaType) setArrhythmiaType(processedSignal.arrhythmiaType);
      
      // Actualizar calidad y lecturas
      setMeasurementQuality(processedSignal.quality.overall);
      if (processedSignal.readings) {
        setReadings(prev => [...prev, ...processedSignal.readings].slice(-100));
      }

      setIsProcessing(false);
    } catch (error) {
      console.error('[PPG] Error procesando frame:', error);
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Error en el procesamiento",
        description: "Error al procesar la imagen de la cámara."
      });
    }
  }, [isStarted, toast]);

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
