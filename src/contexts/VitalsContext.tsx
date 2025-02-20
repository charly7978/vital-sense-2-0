
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { CardiacAnalysisPro } from '../utils/CardiacAnalysisPro';
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
const cardiacAnalyzer = new CardiacAnalysisPro();

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
      
      // Extraemos el canal rojo para análisis cardíaco
      const redChannel = new Array(imageData.width * imageData.height);
      for (let i = 0, j = 0; i < imageData.data.length; i += 4, j++) {
        redChannel[j] = imageData.data[i];
      }
      
      // Creamos una señal PPG básica para el análisis cardíaco
      const processedSignal = {
        signal: redChannel,
        quality: 1.0,
        features: {
          peaks: [],
          valleys: [],
          frequency: 0,
          amplitude: 0,
          perfusionIndex: 0
        },
        confidence: 1.0,
        timestamp: Date.now(),
        bpm: 0,
        spo2: 0,
        systolic: 0,
        diastolic: 0,
        hasArrhythmia: false,
        arrhythmiaType: 'Normal',
        readings: [],
        signalQuality: 1.0
      };

      const cardiacResult = await cardiacAnalyzer.analyzeCardiacSignal(processedSignal);
      
      if (cardiacResult.valid) {
        // Actualizar lecturas en tiempo real
        const newReading: VitalReading = {
          timestamp: Date.now(),
          value: cardiacResult.heartbeat?.intensity || 0
        };

        setReadings(prev => [...prev.slice(-100), newReading]);
        
        // Actualizar métricas vitales
        if (cardiacResult.heartbeat?.bpm && cardiacResult.heartbeat.bpm > 40 && cardiacResult.heartbeat.bpm < 200) {
          setBpm(Math.round(cardiacResult.heartbeat.bpm));
        }

        setHasArrhythmia(cardiacResult.arrhythmia?.isPresent || false);
        setArrhythmiaType(cardiacResult.arrhythmia?.type || 'Normal');
        
        // Actualizar calidad de la señal
        setMeasurementQuality(cardiacResult.heartbeat?.quality || 0);
      }

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
