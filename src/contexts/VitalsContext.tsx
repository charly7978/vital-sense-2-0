
import React, { createContext, useContext, useState, useRef } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { PPGProcessor } from '../utils/ppgProcessor';
import { VitalReading } from '../utils/types';

interface VitalsContextType {
  bpm: number;
  readings: VitalReading[];
  startMeasurement: () => void;
  stopMeasurement: () => void;
}

const VitalsContext = createContext<VitalsContextType | undefined>(undefined);

const beepPlayer = new BeepPlayer();
const ppgProcessor = new PPGProcessor();

export const VitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bpm, setBPM] = useState(0);
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const processingRef = useRef<boolean>(false);

  const startMeasurement = () => {
    processingRef.current = true;
    setReadings([]); // Reset readings when starting new measurement
    processSignal();
  };

  const stopMeasurement = () => {
    processingRef.current = false;
    setBPM(0);
    setReadings([]); // Clear readings when stopping
  };

  const processSignal = () => {
    if (!processingRef.current) return;

    // Simulación de un nuevo valor de señal (esto debe venir del sensor real)
    const newSignal = Math.random() * 0.02 + 0.98; // Simulación de señal estable
    const timestamp = performance.now();

    const newBPM = ppgProcessor.processSignal([newSignal], timestamp);
    setBPM(newBPM);

    // Agregar nueva lectura al array de readings
    setReadings(prev => [...prev, {
      timestamp: Date.now(),
      value: newSignal
    }].slice(-100)); // Mantener solo las últimas 100 lecturas

    if (newBPM > 0) {
      beepPlayer.playBeep();
    }

    setTimeout(processSignal, 1000 / 30);
  };

  return (
    <VitalsContext.Provider value={{ 
      bpm, 
      readings, // Incluir readings en el value del context
      startMeasurement, 
      stopMeasurement 
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
