
import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { PPGProcessor } from '@/lib/PPGProcessor';
import { BeepPlayer } from '@/lib/BeepPlayer';
import { PPGData, SignalQuality, SignalQualityLevel } from '@/types';

// Definir el tipo para el contexto
interface VitalsContextType {
  vitals: PPGData | null;
  isProcessing: boolean;
  isCalibrating: boolean;
  calibrationProgress: number;
  signalQuality: SignalQuality;
  ppgData: Array<{ time: number; value: number }>;
  startProcessing: () => Promise<void>;
  stopProcessing: () => void;
  startCalibration: () => void;
}

// Crear el contexto
const VitalsContext = createContext<VitalsContextType | null>(null);

// Hook personalizado para usar el contexto
export const useVitals = () => {
  const context = useContext(VitalsContext);
  if (!context) {
    throw new Error('useVitals debe usarse dentro de un VitalsProvider');
  }
  return context;
};

// Proveedor del contexto
export const VitalsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Referencias a los procesadores
  const ppgProcessor = useRef<PPGProcessor | null>(null);
  const beepPlayer = useRef<BeepPlayer | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number>(0);

  // Estado
  const [vitals, setVitals] = useState<PPGData | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCalibrating, setIsCalibrating] = useState(false);
  const [calibrationProgress, setCalibrationProgress] = useState(0);
  const [ppgData, setPpgData] = useState<Array<{ time: number; value: number }>>([]);
  const [signalQuality, setSignalQuality] = useState<SignalQuality>({
    overall: 0,
    signal: 0,
    noise: 0,
    movement: 0,
    confidence: 0,
    score: 0,
    history: [],
    level: SignalQualityLevel.Invalid
  });

  // Procesar frame de video con verificaciones
  const processFrame = () => {
    if (!videoRef.current || !canvasRef.current || !ppgProcessor.current) {
      console.warn('Procesamiento detenido: componentes no inicializados');
      return;
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) {
      console.error('No se pudo obtener el contexto 2D');
      return;
    }

    try {
      // Dibujar frame en canvas
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Obtener datos de imagen
      const imageData = context.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      // Procesar frame
      const results = ppgProcessor.current.processFrame(imageData);
      
      if (results) {
        setVitals(results);
        
        // Actualizar datos PPG - con verificación de valores
        setPpgData(prevData => {
          const value = results.values && results.values.length > 0 
            ? results.values[results.values.length - 1] 
            : 0;
            
          const newData = [...prevData, { 
            time: Date.now(), 
            value
          }];
          
          return newData.length > 100 ? newData.slice(-100) : newData;
        });

        // Reproducir beep si hay pulso detectado
        if (results.bpm && results.bpm > 0 && beepPlayer.current) {
          beepPlayer.current.play(440, 50);
        }
      }

      // Continuar procesamiento
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } catch (error) {
      console.error('Error en processFrame:', error);
      setIsProcessing(false);
    }
  };

  // Iniciar procesamiento con verificaciones
  const startProcessing = async () => {
    if (!videoRef.current) {
      console.error('Video ref no inicializada');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      });

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
      console.error('Error al acceder a la cámara:', error);
      setIsProcessing(false);
    }
  };

  const startCalibration = () => {
    if (ppgProcessor.current && isProcessing) {
      setIsCalibrating(true);
      setTimeout(() => setIsCalibrating(false), 5000);
    }
  };

  // Detener procesamiento con verificaciones
  const stopProcessing = () => {
    setIsProcessing(false);
    
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    try {
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
        videoRef.current.srcObject = null;
      }

      if (ppgProcessor.current) {
        ppgProcessor.current.stop();
      }
      if (beepPlayer.current) {
        beepPlayer.current.stop();
      }
    } catch (error) {
      console.error('Error al detener procesamiento:', error);
    }
  };

  // Inicializar procesadores
  useEffect(() => {
    try {
      ppgProcessor.current = new PPGProcessor();
      beepPlayer.current = new BeepPlayer();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        if (videoRef.current?.srcObject) {
          const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
          tracks.forEach(track => track.stop());
        }

        if (ppgProcessor.current) {
          ppgProcessor.current.stop();
        }
        
        if (beepPlayer.current) {
          beepPlayer.current.stop();
        }
      };
    } catch (error) {
      console.error('Error al inicializar procesadores:', error);
    }
  }, []);

  return (
    <VitalsContext.Provider
      value={{
        vitals,
        isProcessing,
        isCalibrating,
        calibrationProgress,
        signalQuality,
        ppgData,
        startProcessing,
        stopProcessing,
        startCalibration
      }}
    >
      <video
        ref={videoRef}
        style={{ display: 'none' }}
        playsInline
      />
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
      {children}
    </VitalsContext.Provider>
  );
};

export default VitalsProvider;
