
import React, { createContext, useContext, useState, useRef } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { PPGProcessor } from '../utils/ppgProcessor';
import { VitalReading, PPGData } from '../utils/types';

interface VitalsContextType {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  hasArrhythmia: boolean;
  arrhythmiaType: string;
  readings: VitalReading[];
  isStarted: boolean;
  fingerPresent: boolean;
  toggleMeasurement: () => void;
  processFrame: (imageData: ImageData) => void;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

const beepPlayer = new BeepPlayer();
const ppgProcessor = new PPGProcessor();

export const VitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bpm, setBPM] = useState(0);
  const [spo2, setSPO2] = useState(0);
  const [systolic, setSystolic] = useState(0);
  const [diastolic, setDiastolic] = useState(0);
  const [hasArrhythmia, setHasArrhythmia] = useState(false);
  const [arrhythmiaType, setArrhythmiaType] = useState('');
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [fingerPresent, setFingerPresent] = useState(false);

  const toggleMeasurement = () => {
    setIsStarted(!isStarted);
    if (!isStarted) {
      setReadings([]);
      setBPM(0);
      setSPO2(0);
      setSystolic(0);
      setDiastolic(0);
    }
  };

  const processFrame = (imageData: ImageData) => {
    if (!isStarted) return;

    // Simulación temporal de datos PPG
    const timestamp = Date.now();
    const newReading: VitalReading = {
      timestamp,
      value: Math.random() * 0.02 + 0.98,
      redValue: imageData.data[0]
    };

    // Procesar señal y actualizar valores
    const newBPM = ppgProcessor.processSignal([newReading.value], timestamp);
    setBPM(Math.round(newBPM));

    // Actualizar lecturas manteniendo solo las últimas 100
    setReadings(prev => [...prev, newReading].slice(-100));

    // Detectar presencia del dedo basado en el valor rojo
    const isFingerDetected = imageData.data[0] > 100;
    setFingerPresent(isFingerDetected);

    if (newBPM > 0 && isFingerDetected) {
      beepPlayer.playBeep();
    }
  };

  return (
    <VitalsContext.Provider value={{
      bpm,
      spo2,
      systolic,
      diastolic,
      hasArrhythmia,
      arrhythmiaType,
      readings,
      isStarted,
      fingerPresent,
      toggleMeasurement,
      processFrame
    }}>
      {children}
    </VitalsContext.Provider>
  );
};

export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (!context) {
    throw new Error("useVitals debe usarse dentro de un VitalsProvider");
  }
  return context;
};
