// ==================== VitalsContext.tsx ====================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { SignalProcessor } from '@/lib/SignalProcessor';
import { PPGProcessor } from '@/lib/PPGProcessor';
import { BeepPlayer } from '@/lib/BeepPlayer';
import type { VitalReading, SensitivitySettings, PPGData } from '@/utils/types';

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
  // Estados básicos
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

  // Referencias a procesadores
  const ppgProcessor = useRef<PPGProcessor>(new PPGProcessor());
  const beepPlayer = useRef<BeepPlayer>(new BeepPlayer());
  const startTime = useRef<number>(0);
  const frameCount = useRef<number>(0);
  const lastValidBpm = useRef<number>(0);
  const measurementDuration = 12000; // 12 segundos

  // Configuración optimizada para móviles
  const [sensitivitySettings, setSensitivitySettings] = useState<SensitivitySettings>({
    signalAmplification: 1.2,    // Reducido para mejor estabilidad
    noiseReduction: 1.5,         // Aumentado para mejor filtrado
    peakDetection: 1.1,          // Ajustado para menos falsos positivos
    heartbeatThreshold: 0.7,     // Aumentado para mejor detección
    responseTime: 1.2,           // Ajustado para mejor estabilidad
    signalStability: 0.7,        // Aumentado para mejor calidad
    brightness: 0.8,             // Optimizado para luz tenue
    redIntensity: 1.2            // Ajustado para mejor señal
  });

  // Manejo de medición
  const toggleMeasurement = useCallback(() => {
    if (!isStarted) {
      // Iniciar medición
      setIsStarted(true);
      startTime.current = Date.now();
      frameCount.current = 0;
      lastValidBpm.current = 0;
      setMeasurementProgress(0);
      setMeasurementQuality(0);
      setBpm(0);
      setSpo2(0);
      setSystolic(0);
      setDiastolic(0);
      setHasArrhythmia(false);
      setArrhythmiaType('Normal');
      setReadings([]);
    } else {
      // Detener medición
      setIsStarted(false);
      beepPlayer.current.stop();
    }
  }, [isStarted]);

  // Procesamiento de frames optimizado
  const processFrame = useCallback(async (imageData: ImageData) => {
    if (!isStarted || isProcessing) return;
    
    setIsProcessing(true);
    frameCount.current++;

    try {
      // Calcular progreso
      const elapsed = Date.now() - startTime.current;
      const progress = Math.min((elapsed / measurementDuration) * 100, 100);
      setMeasurementProgress(progress);

      // Procesar frame
      const result = await ppgProcessor.current.processFrame(imageData);
      
      if (result) {
        // Actualizar calidad
        setMeasurementQuality(result.signalQuality);

        // Validar y actualizar BPM
        if (result.bpm > 0 && result.signalQuality > 0.4) {
          if (lastValidBpm.current === 0 || 
              Math.abs(result.bpm - lastValidBpm.current) <= 15) {
            setBpm(result.bpm);
            lastValidBpm.current = result.bpm;
          }
        }

        // Actualizar SpO2 si es válido
        if (result.spo2 > 0 && result.confidence > 70) {
          setSpo2(result.spo2);
        }

        // Actualizar presión arterial si es válida
        if (result.systolic > 0 && result.diastolic > 0 && result.signalQuality > 0.6) {
          setSystolic(result.systolic);
          setDiastolic(result.diastolic);
        }

        // Actualizar estado de arritmia
        setHasArrhythmia(result.hasArrhythmia);
        setArrhythmiaType(result.arrhythmiaType);

        // Actualizar lecturas para el gráfico
        if (result.readings.length > 0) {
          setReadings(prev => {
            const newReadings = [...prev, ...result.readings];
            return newReadings.slice(-360); // Mantener 12 segundos de datos
          });
        }

        // Reproducir beep si es un pico válido
        if (result.isPeak && result.signalQuality > 0.6) {
          beepPlayer.current.play();
        }
      }

      // Detener automáticamente después de 12 segundos
      if (progress >= 100) {
        toggleMeasurement();
      }

    } catch (error) {
      console.error('Error procesando frame:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isStarted, isProcessing, toggleMeasurement]);

  // Actualizar configuración de sensibilidad
  const updateSensitivitySettings = useCallback((settings: SensitivitySettings) => {
    setSensitivitySettings(settings);
    ppgProcessor.current.updateSettings(settings);
  }, []);

  // Limpiar al desmontar
  useEffect(() => {
    return () => {
      beepPlayer.current.stop();
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

export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (context === undefined) {
    throw new Error('useVitals must be used within a VitalsProvider');
  }
  return context;
};
