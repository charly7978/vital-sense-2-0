
import React, { createContext, useContext, useState } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { PPGProcessor } from '../utils/ppgProcessor';
import { SignalExtractor } from '../utils/signalExtraction';
import { VitalReading } from '../utils/types';

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

const signalExtractor = new SignalExtractor();
const ppgProcessor = new PPGProcessor();
const beepPlayer = new BeepPlayer();

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
      ppgProcessor.reset();
    }
  };

  const processFrame = (imageData: ImageData) => {
    if (!isStarted) return;

    const timestamp = Date.now();
    const { red, ir, quality, fingerPresent: isFingerDetected } = signalExtractor.extractSignal(imageData);
    
    setFingerPresent(isFingerDetected);

    if (isFingerDetected) {
      const newReading: VitalReading = {
        timestamp,
        value: red / 255,
        redValue: red
      };

      const newBPM = ppgProcessor.processSignal([newReading.value], timestamp, quality);
      setBPM(Math.round(newBPM));

      setReadings(prev => [...prev, newReading].slice(-100));

      if (newBPM > 0) {
        beepPlayer.playBeep();
      }

      // Cálculo de SpO2 (simplificado)
      const redAC = Math.max(...readings.slice(-10).map(r => r.value)) - 
                   Math.min(...readings.slice(-10).map(r => r.value));
      const irAC = redAC * 0.98; // Simulación de IR
      const spO2 = Math.round(110 - 25 * (redAC / irAC));
      if (spO2 >= 80 && spO2 <= 100) {
        setSPO2(spO2);
      }
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
