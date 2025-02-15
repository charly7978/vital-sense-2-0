
import React, { createContext, useContext, useState, useEffect } from 'react';
import { BeepPlayer } from '../utils/audioUtils';
import { PPGProcessor } from '../utils/ppgProcessor';
import { SignalExtractor } from '../utils/signalExtraction';
import { VitalReading } from '../utils/types';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [bpm, setBPM] = useState(0);
  const [spo2, setSPO2] = useState(0);
  const [systolic, setSystolic] = useState(0);
  const [diastolic, setDiastolic] = useState(0);
  const [hasArrhythmia, setHasArrhythmia] = useState(false);
  const [arrhythmiaType, setArrhythmiaType] = useState('');
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [isStarted, setIsStarted] = useState(false);
  const [fingerPresent, setFingerPresent] = useState(false);
  const [lastProcessingTime, setLastProcessingTime] = useState(0);

  useEffect(() => {
    if (isStarted && !fingerPresent) {
      toast({
        title: "Dedo no detectado",
        description: "Por favor, coloque su dedo frente a la cámara",
        duration: 3000,
      });
    }
  }, [isStarted, fingerPresent, toast]);

  const toggleMeasurement = () => {
    setIsStarted(!isStarted);
    if (!isStarted) {
      console.log('🟢 Iniciando medición');
      setReadings([]);
      setBPM(0);
      setSPO2(0);
      setSystolic(0);
      setDiastolic(0);
      ppgProcessor.reset();
    } else {
      console.log('🔴 Deteniendo medición');
    }
  };

  const processFrame = (imageData: ImageData) => {
    if (!isStarted) return;

    const now = Date.now();
    if (now - lastProcessingTime < 33) return; // Limitar a ~30fps
    setLastProcessingTime(now);

    console.log('🎥 Procesando frame:', {
      timestamp: now,
      dimensiones: `${imageData.width}x${imageData.height}`,
      datos: imageData.data.length
    });

    const { red, ir, quality, fingerPresent: isFingerDetected } = signalExtractor.extractSignal(imageData);
    
    setFingerPresent(isFingerDetected);

    if (isFingerDetected && quality > 0.3) {
      const newReading: VitalReading = {
        timestamp: now,
        value: red / 255,
        redValue: red
      };

      console.log('📊 Nueva lectura:', {
        valor: newReading.value,
        rojo: red,
        calidad: quality
      });

      const newBPM = ppgProcessor.processSignal([newReading.value], now, quality);
      
      if (newBPM > 0) {
        setBPM(Math.round(newBPM));
        beepPlayer.playBeep();

        // Actualizar SpO2
        if (readings.length >= 10) {
          const redAC = Math.max(...readings.slice(-10).map(r => r.value)) - 
                       Math.min(...readings.slice(-10).map(r => r.value));
          const irAC = redAC * 0.98;
          const spO2 = Math.round(110 - 25 * (redAC / irAC));
          
          if (spO2 >= 80 && spO2 <= 100) {
            setSPO2(spO2);
          }
        }
      }

      setReadings(prev => [...prev, newReading].slice(-100));
    } else {
      console.log('⚠️ Señal no válida:', {
        dedoDetectado: isFingerDetected,
        calidad: quality
      });
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
