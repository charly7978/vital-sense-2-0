
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

const MEASUREMENT_DURATION = 30; // seconds
const MIN_QUALITY_THRESHOLD = 0.3; // Umbral mínimo de calidad para considerar mediciones válidas
const MIN_READINGS_FOR_BP = 10; // Mínimo de lecturas válidas para calcular presión arterial

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
  const [validReadingsCount, setValidReadingsCount] = useState(0);
  const [sensitivitySettings, setSensitivitySettings] = useState<SensitivitySettings>({
    signalAmplification: 1.5,
    noiseReduction: 1.2,
    peakDetection: 1.3
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
  }, []);

  const updateSensitivitySettings = useCallback((newSettings: SensitivitySettings) => {
    setSensitivitySettings(newSettings);
    ppgProcessor.updateSensitivitySettings(newSettings);
  }, []);

  const processFrame = useCallback(async (imageData: ImageData) => {
    if (!isStarted) return;

    setIsProcessing(true);
    try {
      const vitals = await ppgProcessor.processFrame(imageData);
      
      // Solo actualizar mediciones si la calidad es suficiente
      if (vitals && vitals.signalQuality > MIN_QUALITY_THRESHOLD) {
        setMeasurementQuality(vitals.signalQuality);
        setValidReadingsCount(prev => prev + 1);

        if (vitals.isPeak) {
          console.log('Pico detectado, reproduciendo beep');
          await beepPlayer.playBeep('heartbeat');
        }

        if (vitals.bpm > 40 && vitals.bpm < 200) {
          setBpm(vitals.bpm);
        }

        if (vitals.spo2 >= 80 && vitals.spo2 <= 100) {
          setSpo2(vitals.spo2);
        }

        if (validReadingsCount >= MIN_READINGS_FOR_BP) {
          if (vitals.systolic > 0 && vitals.diastolic > 0 && 
              vitals.systolic > vitals.diastolic &&
              vitals.systolic >= 90 && vitals.systolic <= 180 &&
              vitals.diastolic >= 60 && vitals.diastolic <= 120) {
            setSystolic(vitals.systolic);
            setDiastolic(vitals.diastolic);
          }
        }

        setHasArrhythmia(vitals.hasArrhythmia);
        setArrhythmiaType(vitals.arrhythmiaType);
        setReadings(ppgProcessor.getReadings());
      } else {
        // Si la calidad es baja, resetear las mediciones
        console.log('Calidad de señal baja:', vitals?.signalQuality || 0);
        resetMeasurements();
      }
    } catch (error) {
      console.error('Error processing frame:', error);
      toast({
        variant: "destructive",
        title: "Error en el procesamiento",
        description: "Error al procesar la imagen de la cámara."
      });
    }
  }, [isStarted, validReadingsCount, toast, resetMeasurements]);

  const toggleMeasurement = useCallback(() => {
    setIsStarted(prev => !prev);
    if (!isStarted) {
      resetMeasurements();
      setMeasurementStartTime(Date.now());
      setMeasurementProgress(0);
      toast({
        title: "Iniciando medición",
        description: `La medición durará ${MEASUREMENT_DURATION} segundos. Por favor, mantenga su dedo frente a la cámara.`
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
              description: "No se obtuvieron suficientes lecturas válidas. Por favor, intente nuevamente."
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
