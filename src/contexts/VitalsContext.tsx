
import React, { createContext, useContext, useState, useRef } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { PPGProcessor } from '../utils/ppgProcessor';

interface VitalReading {
  timestamp: number;
  value: number;
}

interface VitalsContextType {
  bpm: number;
  readings: VitalReading[];
  isMeasuring: boolean;
  startMeasurement: () => void;
  stopMeasurement: () => void;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

const beepPlayer = new BeepPlayer();
const ppgProcessor = new PPGProcessor();

export const VitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bpm, setBPM] = useState(0);
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [isMeasuring, setIsMeasuring] = useState(false);
  const processingRef = useRef<boolean>(false);

  const startMeasurement = () => {
    if (isMeasuring) return; // Evitar múltiples inicios
    setIsMeasuring(true);
    processingRef.current = true;
    processSignal();
  };

  const stopMeasurement = () => {
    setIsMeasuring(false);
    processingRef.current = false;
    setBPM(0);
    setReadings([]);
  };

  const processSignal = () => {
    if (!processingRef.current) return;

    const newSignal = Math.random() * 0.02 + 0.98; // Simulación de señal estable
    const timestamp = performance.now();

    const newBPM = ppgProcessor.processSignal([newSignal], timestamp);
    setBPM(newBPM);

    setReadings((prev) => [...prev, { timestamp, value: newSignal }]);

    if (newBPM > 0) {
      beepPlayer.playBeep();
    }

    setTimeout(processSignal, 1000 / 30);
  };

  return (
    <VitalsContext.Provider value={{ bpm, readings, isMeasuring, startMeasurement, stopMeasurement }}>
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
