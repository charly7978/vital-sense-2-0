// ==================== VitalsContext.tsx ====================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { SignalProcessor } from '@/lib/SignalProcessor';
import { PPGProcessor } from '@/lib/PPGProcessor';
import { BeepPlayer } from '@/lib/BeepPlayer';
import { useToast } from "@/hooks/use-toast";
import type { VitalReading, SensitivitySettings, PPGData } from '@/types';

// OPTIMIZACIÓN: Tipos mejorados
interface VitalsContextType {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  hasArrhythmia: boolean;
  arrhythmiaType: string;
  readings: VitalReading[];
  isStarted: boolean;
  isProcessing: boolean;
  measurementProgress: number;
  measurementQuality: number;
  sensitivitySettings: SensitivitySettings;
  toggleMeasurement: () => void;
  processFrame: (imageData: ImageData) => void;
  updateSensitivitySettings: (settings: SensitivitySettings) => void;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

export const VitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // OPTIMIZACIÓN: Estados mejorados
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

  // OPTIMIZACIÓN: Referencias mejoradas
  const ppgProcessor = useRef<PPGProcessor>(new PPGProcessor());
  const beepPlayer = useRef<BeepPlayer>(new BeepPlayer());
  const startTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastValidBpm = useRef<number>(0);
  const { toast } = useToast();

  // OPTIMIZACIÓN: Constantes mejoradas
  const measurementDuration = 12000; // 12 segundos exactos
  const minQualityThreshold = 0.45;
  const stabilityThreshold = 0.7;

  // OPTIMIZACIÓN: Configuración mejorada
  const [sensitivitySettings, setSensitivitySettings] = useState<SensitivitySettings>({
    signalAmplification: 1.2,    // Optimizado para luz ambiente
    noiseReduction: 1.5,         // Mejor filtrado
    peakDetection: 1.1,          // Menos falsos positivos
    heartbeatThreshold: 0.7,     // Mejor detección
    responseTime: 1.2,           // Mejor estabilidad
    signalStability: 0.7,        // Mejor calidad
    brightness: 0.8,             // Optimizado para luz tenue
    redIntensity: 1.2            // Mejor señal
  });

  // OPTIMIZACIÓN: Toggle de medición mejorado
  const toggleMeasurement = useCallback(() => {
    if (!isStarted) {
      startMeasurement();
    } else {
      stopMeasurement();
    }
  }, [isStarted]);

  // OPTIMIZACIÓN: Inicio de medición mejorado
  const startMeasurement = () => {
    setIsStarted(true);
    startTime.current = Date.now();
    frameCount.current = 0;
    lastValidBpm.current = 0;
    resetMeasurements();
    
    toast({
      title: "Medición iniciada",
      description: "Coloque su dedo en la cámara",
      className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
    });
  };

  // OPTIMIZACIÓN: Fin de medición mejorado
  const stopMeasurement = () => {
    setIsStarted(false);
    beepPlayer.current.stop();
    ppgProcessor.current.stop();
    
    if (measurementQuality > minQualityThreshold) {
      toast({
        title: "Medición completada",
        description: "Resultados guardados",
        className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
      });
    }
  };

  // OPTIMIZACIÓN: Procesamiento de frames mejorado
  const processFrame = useCallback(async (imageData: ImageData) => {
    if (!isStarted || isProcessing) return;
    
    setIsProcessing(true);
    frameCount.current++;

    try {
      // OPTIMIZACIÓN: Cálculo de progreso mejorado
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min((elapsed / measurementDuration) * 100, 100);
      setMeasurementProgress(progress);

      // OPTIMIZACIÓN: Procesamiento de frame mejorado
      const result = await ppgProcessor.current.processFrame(imageData);
      
      if (result) {
        updateMeasurements(result);
      }

      // OPTIMIZACIÓN: Finalización automática mejorada
      if (progress >= 100) {
        handleMeasurementCompletion();
      }

    } catch (error) {
      console.error('Error procesando frame:', error);
      handleProcessingError();
    } finally {
      setIsProcessing(false);
    }
  }, [isStarted, isProcessing]);

  // OPTIMIZACIÓN: Actualización de mediciones mejorada
  const updateMeasurements = (result: PPGData) => {
    setMeasurementQuality(result.quality);

    if (result.quality > minQualityThreshold) {
      updateVitalSigns(result);
      updateReadings(result);
    }
  };

  // OPTIMIZACIÓN: Actualización de signos vitales mejorada
  const updateVitalSigns = (result: PPGData) => {
    if (result.bpm > 0 && isStableMeasurement(result.bpm, lastValidBpm.current)) {
      setBpm(result.bpm);
      lastValidBpm.current = result.bpm;
    }

    if (result.spo2 > 0) {
      setSpo2(result.spo2);
    }

    if (result.systolic > 0 && result.diastolic > 0) {
      setSystolic(result.systolic);
      setDiastolic(result.diastolic);
    }

    setHasArrhythmia(result.hasArrhythmia);
    setArrhythmiaType(result.arrhythmiaType);
  };

  // OPTIMIZACIÓN: Actualización de lecturas mejorada
  const updateReadings = (result: PPGData) => {
    setReadings(prev => {
      const newReadings = [...prev, {
        timestamp: result.timestamp,
        value: result.value,
        isPeak: result.isPeak
      }];
      return newReadings.slice(-360); // 12 segundos de datos
    });
  };

  // OPTIMIZACIÓN: Métodos auxiliares mejorados
  const isStableMeasurement = (current: number, previous: number): boolean => {
    if (previous === 0) return true;
    return Math.abs(current - previous) <= 15;
  };

  const resetMeasurements = () => {
    setMeasurementProgress(0);
    setMeasurementQuality(0);
    setBpm(0);
    setSpo2(0);
    setSystolic(0);
    setDiastolic(0);
    setHasArrhythmia(false);
    setArrhythmiaType('Normal');
    setReadings([]);
  };

  const handleMeasurementCompletion = () => {
    if (measurementQuality > minQualityThreshold) {
      toast({
        title: "Medición exitosa",
        description: `Calidad: ${(measurementQuality * 100).toFixed(0)}%`,
        className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
      });
    } else {
      toast({
        title: "Calidad insuficiente",
        description: "Intente nuevamente",
        variant: "destructive",
        className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
      });
    }
    toggleMeasurement();
  };

  const handleProcessingError = () => {
    toast({
      title: "Error de procesamiento",
      description: "Intente nuevamente",
      variant: "destructive",
      className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
    });
    toggleMeasurement();
  };

  // OPTIMIZACIÓN: Actualización de configuración mejorada
  const updateSensitivitySettings = useCallback((settings: SensitivitySettings) => {
    setSensitivitySettings(settings);
    ppgProcessor.current.updateSettings(settings);
  }, []);

  // OPTIMIZACIÓN: Limpieza mejorada
  useEffect(() => {
    return () => {
      beepPlayer.current.stop();
      ppgProcessor.current.stop();
    };
  }, []);

  const value = {
    bpm,
    spo2,
    systolic,
    diastolic,
    hasArrhythmia,
    arrhythmiaType,
    readings,
    isStarted,
    isProcessing,
    measurementProgress,
    measurementQuality,
    sensitivitySettings,
    toggleMeasurement,
    processFrame,
    updateSensitivitySettings,
  };

  return (
    <VitalsContext.Provider value={value}>
      {children}
    </VitalsContext.Provider>
  );
};

// OPTIMIZACIÓN: Hook mejorado
export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (context === undefined) {
    throw new Error('useVitals debe usarse dentro de un VitalsProvider');
  }
  return context;
};
