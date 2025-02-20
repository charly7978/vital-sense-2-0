import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { WaveletPPGProcessor } from '../utils/WaveletPPGProcessor';
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
  updateSensitivitySettings: (settings: Partial<SensitivitySettings>) => void;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

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
  const lastProcessedTime = useRef<number>(0);
  const processingInterval = 33; // ~30fps

  const [sensitivitySettings, setSensitivitySettings] = useState<SensitivitySettings>({
    signalAmplification: 2.5,
    noiseReduction: 1.2,
    peakDetection: 0.8,
    heartbeatThreshold: 0.3,
    responseTime: 0.9,
    signalStability: 1.5,
    brightness: 1.2,
    redIntensity: 1.3
  });

  const { toast } = useToast();
  const ppgProcessor = useRef(new WaveletPPGProcessor());
  const beepPlayer = useRef(new BeepPlayer());

  const processFrame = useCallback(async (imageData: ImageData) => {
    if (!isStarted) return;

    const currentTime = Date.now();
    if (currentTime - lastProcessedTime.current < processingInterval) {
      return;
    }
    lastProcessedTime.current = currentTime;

    try {
      setIsProcessing(true);
      const processedSignal = await ppgProcessor.current.processFrame(imageData);
      
      if (!processedSignal) {
        console.log('No se detectó señal válida');
        return;
      }

      const newReading: VitalReading = {
        timestamp: Date.now(),
        value: processedSignal.signal[0] || 0
      };

      setReadings(prev => [...prev.slice(-100), newReading]);
      
      if (processedSignal.isHeartbeat && processedSignal.bpm > 30 && processedSignal.bpm < 200) {
        console.log('Latido detectado:', processedSignal.bpm, 'BPM');
        setBpm(Math.round(processedSignal.bpm));
        
        const volumeMultiplier = Math.min(1, processedSignal.signalQuality * 2);
        await beepPlayer.current.playHeartbeatSound(volumeMultiplier);
        
        if (processedSignal.spo2 >= 80 && processedSignal.spo2 <= 100) {
          setSpo2(Math.round(processedSignal.spo2));
        }
        
        if (processedSignal.systolic >= 80 && processedSignal.systolic <= 180 &&
            processedSignal.diastolic >= 50 && processedSignal.diastolic <= 120) {
          setSystolic(Math.round(processedSignal.systolic));
          setDiastolic(Math.round(processedSignal.diastolic));
        }

        setHasArrhythmia(processedSignal.hasArrhythmia);
        setArrhythmiaType(processedSignal.arrhythmiaType);
        
        console.log('♥ Mediciones actualizadas:', {
          bpm: processedSignal.bpm,
          spo2: processedSignal.spo2,
          systolic: processedSignal.systolic,
          diastolic: processedSignal.diastolic,
          calidad: processedSignal.signalQuality,
        });
      }

      setMeasurementQuality(processedSignal.signalQuality);
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

  const toggleMeasurement = useCallback(() => {
    if (isStarted) {
      setIsStarted(false);
      resetMeasurements();
    } else {
      resetMeasurements();
      setIsStarted(true);
      
      beepPlayer.current.playHeartbeatSound(0.1).then(() => {
        console.log('Audio inicializado correctamente');
      }).catch(error => {
        console.error('Error inicializando audio:', error);
      });

      toast({
        title: "Iniciando medición",
        description: "Por favor, mantenga su dedo frente a la cámara."
      });
    }
  }, [isStarted, toast, resetMeasurements]);

  const updateSensitivitySettings = useCallback((settings: Partial<SensitivitySettings>) => {
    setSensitivitySettings(prev => {
      const newSettings = { ...prev, ...settings };
      ppgProcessor.current.updateSensitivitySettings(newSettings);
      console.log('📊 Actualizando configuración de sensibilidad:', newSettings);
      return newSettings;
    });
  }, []);

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
