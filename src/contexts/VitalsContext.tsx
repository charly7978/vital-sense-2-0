// ==================== VitalsContext.tsx ====================

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { SignalProcessor } from '@/lib/SignalProcessor';
import { PPGProcessor } from '@/lib/PPGProcessor';
import { BeepPlayer } from '@/lib/BeepPlayer';
import type { VitalReading, SensitivitySettings, PPGData } from '@/types';

// OPTIMIZACIÓN: Tipos mejorados para mejor control
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
  // OPTIMIZACIÓN: Estados iniciales mejorados
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
  private readonly measurementDuration = 12000; // 12 segundos exactos

  // OPTIMIZACIÓN: Configuración optimizada para móviles
  const [sensitivitySettings, setSensitivitySettings] = useState<SensitivitySettings>({
    signalAmplification: 1.2,    // Antes: 1.5 (más estable)
    noiseReduction: 1.5,         // Antes: 1.2 (mejor filtrado)
    peakDetection: 1.1,          // Antes: 1.3 (menos falsos positivos)
    heartbeatThreshold: 0.7,     // Antes: 0.5 (mejor detección)
    responseTime: 1.2,           // Antes: 1.0 (mejor estabilidad)
    signalStability: 0.7,        // Antes: 0.5 (mejor calidad)
    brightness: 0.8,             // Optimizado para luz tenue
    redIntensity: 1.2            // Ajustado para mejor señal
  });

  // OPTIMIZACIÓN: Toggle de medición mejorado
  const toggleMeasurement = useCallback(() => {
    if (!isStarted) {
      // OPTIMIZACIÓN: Inicio de medición mejorado
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
      // OPTIMIZACIÓN: Finalización de medición mejorada
      setIsStarted(false);
      beepPlayer.current.stop();
    }
  }, [isStarted]);

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
        // OPTIMIZACIÓN: Actualización de calidad mejorada
        setMeasurementQuality(result.signalQuality);

        // OPTIMIZACIÓN: Validación de BPM mejorada
        if (result.bpm > 0 && result.signalQuality > 0.4) {
          if (lastValidBpm.current === 0 || 
              Math.abs(result.bpm - lastValidBpm.current) <= 15) {
            setBpm(result.bpm);
            lastValidBpm.current = result.bpm;
          }
        }

        // OPTIMIZACIÓN: Actualización de SpO2 mejorada
        if (result.spo2 > 0 && result.confidence > 70) {
          setSpo2(result.spo2);
        }

        // OPTIMIZACIÓN: Actualización de presión arterial mejorada
        if (result.systolic > 0 && result.diastolic > 0 && result.signalQuality > 0.6) {
          setSystolic(result.systolic);
          setDiastolic(result.diastolic);
        }

        // OPTIMIZACIÓN: Actualización de arritmia mejorada
        setHasArrhythmia(result.hasArrhythmia);
        setArrhythmiaType(result.arrhythmiaType);

        // OPTIMIZACIÓN: Actualización de lecturas mejorada
        if (result.readings.length > 0) {
          setReadings(prev => {
            const newReadings = [...prev, ...result.readings];
            return newReadings.slice(-360); // 12 segundos de datos
          });
        }

        // OPTIMIZACIÓN: Reproducción de beep mejorada
        if (result.isPeak && result.signalQuality > 0.6) {
          beepPlayer.current.play();
        }
      }

      // OPTIMIZACIÓN: Finalización automática mejorada
      if (progress >= 100) {
        toggleMeasurement();
      }

    } catch (error) {
      console.error('Error procesando frame:', error);
    } finally {
      setIsProcessing(false);
    }
  }, [isStarted, isProcessing, toggleMeasurement]);

  // OPTIMIZACIÓN: Actualización de configuración mejorada
  const updateSensitivitySettings = useCallback((settings: SensitivitySettings) => {
    setSensitivitySettings(settings);
    ppgProcessor.current.updateSettings(settings);
  }, []);

  // OPTIMIZACIÓN: Limpieza mejorada
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

// OPTIMIZACIÓN: Hook mejorado
export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (context === undefined) {
    throw new Error('useVitals debe usarse dentro de un VitalsProvider');
  }
  return context;
};
