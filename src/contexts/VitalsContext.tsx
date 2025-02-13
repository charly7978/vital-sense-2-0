
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
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

export const VitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { toast } = useToast();
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
  const [fingerPresent, setFingerPresent] = useState<boolean>(false);
  const [sensitivitySettings, setSensitivitySettings] = useState<SensitivitySettings>({
    signalAmplification: 2.0,
    noiseReduction: 1.0,
    peakDetection: 1.1
  });

  // Refs para prevenir actualizaciones innecesarias
  const lastUpdateTime = useRef(0);
  const processingFrame = useRef(false);
  const lastFingerState = useRef(false);
  const lastValidReadings = useRef<VitalReading[]>([]);

  const updateSensitivitySettings = useCallback((settings: SensitivitySettings) => {
    setSensitivitySettings(settings);
  }, []);

  const processFrame = useCallback(async (imageData: ImageData) => {
    if (!isStarted || processingFrame.current) return;
    
    const now = Date.now();
    if (now - lastUpdateTime.current < 33) return; // Limitar a ~30fps
    
    processingFrame.current = true;
    
    try {
      const vitals = await ppgProcessor.processFrame(imageData);
      
      if (vitals) {
        // Prevenir cambios de estado innecesarios
        if (vitals.fingerPresent !== lastFingerState.current) {
          setFingerPresent(vitals.fingerPresent);
          lastFingerState.current = vitals.fingerPresent;
        }
        
        if (vitals.fingerPresent) {
          // Actualizar lecturas solo si hay cambios significativos
          if (vitals.readings.length > 0 && 
              JSON.stringify(vitals.readings) !== JSON.stringify(lastValidReadings.current)) {
            setReadings(vitals.readings);
            lastValidReadings.current = vitals.readings;
          }

          if (vitals.isPeak) {
            beepPlayer.playBeep('heartbeat');
          }

          // Actualizar valores vitales solo si hay cambios significativos
          if (vitals.bpm > 0 && Math.abs(vitals.bpm - bpm) > 1) {
            setBpm(vitals.bpm);
          }
          if (vitals.spo2 >= 80 && vitals.spo2 <= 100 && Math.abs(vitals.spo2 - spo2) > 0.5) {
            setSpo2(vitals.spo2);
          }
          if (vitals.systolic > 0 && vitals.diastolic > 0 &&
              (Math.abs(vitals.systolic - systolic) > 2 || Math.abs(vitals.diastolic - diastolic) > 2)) {
            setSystolic(vitals.systolic);
            setDiastolic(vitals.diastolic);
          }
          
          setHasArrhythmia(vitals.hasArrhythmia);
          setArrhythmiaType(vitals.arrhythmiaType);
        }
      }
    } catch (error) {
      console.error('Error processing frame:', error);
    } finally {
      processingFrame.current = false;
      lastUpdateTime.current = now;
    }
  }, [isStarted, bpm, spo2, systolic, diastolic]);

  const toggleMeasurement = useCallback(() => {
    setIsStarted(prev => !prev);
    if (!isStarted) {
      resetMeasurements();
      if (toast) {
        toast({
          title: "Iniciando medición",
          description: "La medición durará 30 segundos. Por favor, mantenga su dedo frente a la cámara."
        });
      }
    } else {
      resetMeasurements();
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
    lastValidReadings.current = [];
    lastFingerState.current = false;
  }, []);

  return (
    <VitalsContext.Provider value={{
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
    }}>
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
