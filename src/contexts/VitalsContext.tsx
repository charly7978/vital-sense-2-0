
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
  const [signalQuality, setSignalQuality] = useState(0);

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

    const timestamp = Date.now();
    const redValue = imageData.data[0];
    
    // Calcular calidad de señal basado en el valor rojo
    const quality = Math.max(0, Math.min(1, (redValue / 255) * 0.8));
    setSignalQuality(quality);
    
    // Actualizar detección de dedo
    const isFingerDetected = redValue > 100;
    setFingerPresent(isFingerDetected);

    const newReading: VitalReading = {
      timestamp,
      value: Math.random() * 0.02 + 0.98,
      redValue
    };

    // Procesar señal con calidad
    const newBPM = ppgProcessor.processSignal([newReading.value], timestamp, quality);
    setBPM(Math.round(newBPM));

    // Actualizar lecturas manteniendo solo las últimas 100
    setReadings(prev => [...prev, newReading].slice(-100));

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
