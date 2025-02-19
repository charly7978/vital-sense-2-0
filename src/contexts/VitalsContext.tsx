
import React, { createContext, useContext, useRef, useState, useEffect } from 'react';
import { PPGProcessor } from '@/lib/PPGProcessor';
import { BeepPlayer } from '@/lib/BeepPlayer';
import { SignalQuality, SignalQualityLevel, PPGData } from '@/types';
import { config } from '@/config';

interface VitalsContextType {
  vitals: {
    bpm: number;
    confidence: number;
    timestamp: number;
  } | null;
  isProcessing: boolean;
  isCalibrating: boolean;
  calibrationProgress: number;
  signalQuality: SignalQuality;
  ppgData: Array<{ time: number; value: number }>;
  startProcessing: () => Promise<void>;
  stopProcessing: () => void;
  startCalibration: () => void;
}

const defaultSignalQuality: SignalQuality = {
  level: SignalQualityLevel.Invalid,
  score: 0,
  confidence: 0,
  overall: 0,
  history: []
};

const VitalsContext = createContext<VitalsContextType | null>(null);

export function VitalsProvider({ children }: { children: React.ReactNode }) {
  // Estados
  const [vitals, setVitals] = useState<VitalsContextType['vitals']>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [signalQuality, setSignalQuality] = useState<SignalQuality>(defaultSignalQuality);
  const [ppgData, setPpgData] = useState<Array<{ time: number; value: number }>>([]);

  // Referencias
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ppgProcessor = useRef<PPGProcessor | null>(null);
  const beepPlayer = useRef<BeepPlayer | null>(null);
  const animationFrameRef = useRef<number>(0);
  const streamRef = useRef<MediaStream | null>(null);

  // Inicialización
  useEffect(() => {
    ppgProcessor.current = new PPGProcessor();
    beepPlayer.current = new BeepPlayer();

    return () => {
      stopProcessing();
      if (beepPlayer.current) {
        beepPlayer.current.stop();
      }
    };
  }, []);

  // Procesamiento de frames
  const processFrame = () => {
    if (!isProcessing || !videoRef.current || !canvasRef.current || !ppgProcessor.current) {
      return;
    }

    try {
      const context = canvasRef.current.getContext('2d');
      if (!context) return;

      // Dibujar frame
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Procesar imagen
      const imageData = context.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Procesar PPG
      const result = ppgProcessor.current.processFrame(imageData);
      
      // Actualizar estados
      updateVitals(result);
      updateSignalQuality();
      updatePPGData(result);

      // Reproducir beep si es necesario
      if (result.confidence > 0.5) {
        beepPlayer.current?.play(440 + result.bpm, 50);
      }

      // Continuar procesamiento
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      console.error('Error processing frame:', error);
      stopProcessing();
    }
  };

  // Actualización de datos
  const updateVitals = (result: PPGData) => {
    setVitals({
      bpm: result.bpm,
      confidence: result.confidence,
      timestamp: result.timestamp
    });
  };

  const updateSignalQuality = () => {
    if (ppgProcessor.current) {
      setSignalQuality(ppgProcessor.current.getQuality());
    }
  };

  const updatePPGData = (result: PPGData) => {
    setPpgData(prevData => {
      const newData = [
        ...prevData,
        {
          time: result.timestamp,
          value: result.values[result.values.length - 1]
        }
      ];
      
      // Mantener solo los últimos 100 puntos
      return newData.length > 100 ? newData.slice(-100) : newData;
    });
  };

  // Control de la cámara
  const startProcessing = async () => {
    if (!videoRef.current) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Configurar canvas
      if (canvasRef.current) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
      }

      setIsProcessing(true);
      processFrame();
    } catch (error) {
      console.error('Error accessing camera:', error);
      setIsProcessing(false);
    }
  };

  const stopProcessing = () => {
    setIsProcessing(false);
    
    // Detener cámara
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    // Detener procesamiento
    if (ppgProcessor.current) {
      ppgProcessor.current.stop();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Resetear estados
    setVitals(null);
    setSignalQuality(defaultSignalQuality);
    setPpgData([]);
  };

  // Calibración
  const startCalibration = () => {
    if (ppgProcessor.current && isProcessing) {
      setIsCalibrating(true);
      ppgProcessor.current.startCalibration();

      const checkCalibration = () => {
        if (ppgProcessor.current) {
          const progress = ppgProcessor.current.getCalibrationProgress();
          setCalibrationProgress(progress);

          if (progress < 1) {
            requestAnimationFrame(checkCalibration);
          } else {
            setIsCalibrating(false);
          }
        }
      };

      checkCalibration();
    }
  };

  const value = {
    vitals,
    isProcessing,
    isCalibrating,
    calibrationProgress,
    signalQuality,
    ppgData,
    startProcessing,
    stopProcessing,
    startCalibration
  };

  return (
    <VitalsContext.Provider value={value}>
      <div style={{ display: 'none' }}>
        <video ref={videoRef} playsInline />
        <canvas ref={canvasRef} />
      </div>
      {children}
    </VitalsContext.Provider>
  );
}

export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (!context) {
    throw new Error('useVitals must be used within a VitalsProvider');
  }
  return context;
};

export default VitalsProvider;
