import React, { createContext, useContext, useState, useCallback } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { PPGProcessor } from '../utils/ppgProcessor';
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
  processFrame: (imageData: ImageData) => void;
  updateSensitivitySettings: (settings: SensitivitySettings) => void;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

const beepPlayer = new BeepPlayer();
const ppgProcessor = new PPGProcessor();

const MEASUREMENT_DURATION = 25;

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

  const resetMeasurements = useCallback(() => {
    setBpm(0);
    setSpo2(0);
    setSystolic(0);
    setDiastolic(0);
    setHasArrhythmia(false);
    setArrhythmiaType('Normal');
    setReadings([]);
    setMeasurementProgress(0);
  }, []);

  const updateSensitivitySettings = useCallback((newSettings: SensitivitySettings) => {
    setSensitivitySettings(newSettings);
    ppgProcessor.updateSensitivitySettings(newSettings);
  }, []);

  const processFrame = useCallback(async (imageData: ImageData) => {
    if (!isStarted) return;

    try {
      const vitals = await ppgProcessor.processFrame(imageData);
      
      if (vitals) {
        if (vitals.isPeak) {
          console.log('Pico detectado - Reproduciendo beep');
          await beepPlayer.playBeep('heartbeat', vitals.signalQuality);
        }

        if (vitals.bpm > 0) setBpm(vitals.bpm);
        if (vitals.spo2 > 0) setSpo2(vitals.spo2);
        if (vitals.systolic > 0 && vitals.diastolic > 0) {
          setSystolic(vitals.systolic);
          setDiastolic(vitals.diastolic);
        }
        
        setHasArrhythmia(vitals.hasArrhythmia);
        setArrhythmiaType(vitals.arrhythmiaType);
        setReadings(ppgProcessor.getReadings());
        setMeasurementQuality(vitals.signalQuality);
      }
    } catch (error) {
      console.error('Error procesando frame:', error);
      toast({
        variant: "destructive",
        title: "Error en el procesamiento",
        description: "Error al procesar la imagen de la cámara."
      });
    }
  }, [isStarted, toast]);

  const toggleMeasurement = useCallback(() => {
    if (isStarted) {
      setIsStarted(false);
      setMeasurementStartTime(null);
      resetMeasurements();
    } else {
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
      interval = setInterval(() => {
        const elapsed = (Date.now() - measurementStartTime) / 1000;
        const progress = Math.min((elapsed / MEASUREMENT_DURATION) * 100, 100);
        setMeasurementProgress(progress);

        if (elapsed >= MEASUREMENT_DURATION) {
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
