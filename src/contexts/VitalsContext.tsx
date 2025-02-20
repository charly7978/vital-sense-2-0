import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { UltraAdvancedPPGProcessor } from '../utils/UltraAdvancedPPGProcessor';
import { useToast } from "@/hooks/use-toast";
import type { VitalReading, SensitivitySettings, ProcessedPPGSignal } from '../utils/types';

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

  const processFrame = useCallback(async (imageData: ImageData) => {
    if (!isStarted) return;

    const currentTime = Date.now();
    if (currentTime - lastProcessedTime.current < processingInterval) {
      return;
    }
    lastProcessedTime.current = currentTime;

    try {
      setIsProcessing(true);
      const processedSignal = await ppgProcessor.processFrame(imageData);
      
      // Actualizar lecturas en tiempo real
      const newReading: VitalReading = {
        timestamp: processedSignal.timestamp,
        value: processedSignal.signal[0] || 0
      };

      setReadings(prev => [...prev.slice(-100), newReading]);
      
      // Actualizar métricas vitales
      if (processedSignal.bpm > 40 && processedSignal.bpm < 200) {
        setBpm(Math.round(processedSignal.bpm));
      }

      // Actualizar SpO2
      if (processedSignal.spo2 > 0) {
        setSpo2(processedSignal.spo2);
      }

      // Actualizar presión arterial
      if (processedSignal.systolic > 0 && processedSignal.diastolic > 0) {
        setSystolic(processedSignal.systolic);
        setDiastolic(processedSignal.diastolic);
      }

      // Actualizar calidad de la señal
      setMeasurementQuality(processedSignal.signalQuality);

      // Actualizar estado de arritmia
      setHasArrhythmia(processedSignal.hasArrhythmia);
      setArrhythmiaType(processedSignal.arrhythmiaType);

      setIsProcessing(false);
    } catch (error) {
      console.error('Error procesando frame:', error);
      setIsProcessing(false);
      toast({
        variant: "destructive",
        title: "Error en el procesamiento",
        description: "Error al procesar la imagen de la cámara."
      });
    }
  }, [isStarted, toast]);

  const calculateHeartRateVariability = (peaks: number[]): number => {
    if (peaks.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i-1]);
    }
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    return Math.sqrt(variance) / mean; // Coeficiente de variación
  };

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
      toggleMeasurement();
    }
    toast({
      title: "Medición reiniciada",
      description: "Los valores han sido reiniciados."
    });
  }, [isStarted, resetMeasurements, toast]);

  const updateSensitivitySettings = useCallback((newSettings: SensitivitySettings) => {
    setSensitivitySettings(newSettings);
    ppgProcessor.updateSensitivitySettings(newSettings);
  }, []);

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
