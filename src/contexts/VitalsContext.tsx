
import React, { createContext, useContext, useRef, useEffect, useState } from 'react';
import { PPGProcessor } from '@/lib/PPGProcessor';
import { BeepPlayer } from '@/lib/BeepPlayer';
import { PPGData } from '@/types';

// Definir el tipo para el contexto
interface VitalsContextType {
  vitals: PPGData | null;
  isProcessing: boolean;
  startProcessing: () => void;
  stopProcessing: () => void;
  calibrate: () => void;
  isCalibrating: boolean;
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

  // Inicializar procesadores
  useEffect(() => {
    // Crear instancias
    const processor = new PPGProcessor();
    const beep = new BeepPlayer();
    
    // Asignar a las referencias
    ppgProcessor.current = processor;
    beepPlayer.current = beep;

    // Cleanup
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (videoRef.current?.srcObject) {
        const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
        tracks.forEach(track => track.stop());
      }

      // Detener procesadores
      processor.stop();
      beep.stop();
      
      // Limpiar referencias
      ppgProcessor.current = null;
      beepPlayer.current = null;
    };
  }, []);

  // Procesar frame de video
  const processFrame = () => {
    if (!isProcessing || !videoRef.current || !canvasRef.current || !ppgProcessor.current) {
      return;
    }

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

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
    setVitals(results);

    // Reproducir beep si hay pulso detectado
    if (results.bpm > 0 && beepPlayer.current) {
      beepPlayer.current.play(440, 50);
    }

    // Continuar procesamiento
    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Iniciar procesamiento
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
    }
  };

  // Detener procesamiento
  const stopProcessing = () => {
    setIsProcessing(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Detener video
    if (videoRef.current?.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    // Detener procesadores
    if (ppgProcessor.current) {
      ppgProcessor.current.stop();
    }
    if (beepPlayer.current) {
      beepPlayer.current.stop();
    }
  };

  // Iniciar calibración
  const calibrate = () => {
    if (!ppgProcessor.current) return;
    
    setIsCalibrating(true);
    ppgProcessor.current.startCalibration();
    setTimeout(() => setIsCalibrating(false), 5000);
  };

  return (
    <VitalsContext.Provider
      value={{
        vitals,
        isProcessing,
        startProcessing,
        stopProcessing,
        calibrate,
        isCalibrating
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
