
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
  fingerPresent: boolean;
  sensitivitySettings: SensitivitySettings;
  toggleMeasurement: () => void;
  processFrame: (imageData: ImageData) => void;
  updateSensitivitySettings: (settings: SensitivitySettings) => void;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

const beepPlayer = new BeepPlayer();
const ppgProcessor = new PPGProcessor();

const MEASUREMENT_DURATION = 30; // seconds
const MIN_QUALITY_THRESHOLD = 0.25;
const MIN_READINGS_FOR_BP = 10;

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
  const [fingerPresent, setFingerPresent] = useState(false);
  const [measurementStartTime, setMeasurementStartTime] = useState<number | null>(null);
  const [validReadingsCount, setValidReadingsCount] = useState(0);
  const [sensitivitySettings, setSensitivitySettings] = useState<SensitivitySettings>({
    signalAmplification: 2.0,
    noiseReduction: 1.0,
    peakDetection: 1.1
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
    setValidReadingsCount(0);
    setFingerPresent(false);
  }, []);

  const updateSensitivitySettings = useCallback((newSettings: SensitivitySettings) => {
    setSensitivitySettings(newSettings);
    ppgProcessor.updateSensitivitySettings(newSettings);
  }, []);

  const processFrame = useCallback(async (imageData: ImageData) => {
    if (!isStarted) return;

    setIsProcessing(true);
    try {
      const result = await ppgProcessor.processFrame(imageData);
      
      // Actualización más segura del estado del dedo
      const isFingerDetected = (result?.red !== undefined && result?.red > 0) && 
                              (result?.quality !== undefined && result?.quality > 0);
      setFingerPresent(isFingerDetected);
      console.log('Estado de detección del dedo:', isFingerDetected, {
        red: result?.red,
        quality: result?.quality
      });

      // Solo procesar las mediciones si hay dedo presente
      if (isFingerDetected) {
        setMeasurementQuality(result?.signalQuality || 0);

        if (result?.bpm > 40 && result?.bpm < 200) {
          setBpm(result.bpm);
          setValidReadingsCount(prev => prev + 1);
        }

        if (result?.spo2 >= 80 && result?.spo2 <= 100) {
          setSpo2(result.spo2);
        }

        if (validReadingsCount >= MIN_READINGS_FOR_BP) {
          if (result?.systolic > 0 && result?.diastolic > 0 && 
              result?.systolic > result?.diastolic &&
              result?.systolic >= 90 && result?.systolic <= 180 &&
              result?.diastolic >= 60 && result?.diastolic <= 120) {
            setSystolic(result.systolic);
            setDiastolic(result.diastolic);
          }
        }

        if (result?.isPeak) {
          beepPlayer.playBeep('heartbeat').catch(console.error);
        }

        setHasArrhythmia(result?.hasArrhythmia || false);
        setArrhythmiaType(result?.arrhythmiaType || 'Normal');
        setReadings(ppgProcessor.getReadings());
      }

    } catch (error) {
      console.error('Error processing frame:', error);
      toast({
        variant: "destructive",
        title: "Error en el procesamiento",
        description: "Error al procesar la imagen de la cámara."
      });
    }
  }, [isStarted, validReadingsCount, toast]);

  const toggleMeasurement = useCallback(() => {
    setIsStarted(prev => !prev);
    if (!isStarted) {
      resetMeasurements();
      setMeasurementStartTime(Date.now());
      setMeasurementProgress(0);
      toast({
        title: "Iniciando medición",
        description: "Por favor, coloque su dedo frente a la cámara."
      });
    } else {
      setMeasurementStartTime(null);
      setIsProcessing(false);
      resetMeasurements();
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
          if (validReadingsCount > MIN_READINGS_FOR_BP) {
            beepPlayer.playBeep('success');
            toast({
              title: "Medición completada",
              description: "La medición se ha completado exitosamente."
            });
          } else {
            toast({
              variant: "destructive",
              title: "Medición incompleta",
              description: "No se obtuvieron suficientes lecturas válidas."
            });
            resetMeasurements();
          }
        }
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isStarted, measurementStartTime, validReadingsCount, toast, resetMeasurements]);

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
    fingerPresent,
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
