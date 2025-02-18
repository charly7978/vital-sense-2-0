// ==================== CameraView.tsx ====================

import React, { useRef, useEffect, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
  onMeasurementEnd?: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ 
  onFrame, 
  isActive, 
  onMeasurementEnd 
}) => {
  // OPTIMIZACIÓN: Referencias mejoradas
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();

  // OPTIMIZACIÓN: Estados mejorados
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  // OPTIMIZACIÓN: Configuración de cámara mejorada
  const videoConstraints = {
    width: 1280,
    height: 720,
    facingMode: "environment",
    frameRate: 30,
    aspectRatio: 16/9,
    advanced: [{
      // OPTIMIZACIÓN: Configuración para luz ambiente
      exposureMode: "manual",
      exposureTime: 2000,           // Aumentado para luz ambiente
      exposureCompensation: 1.0,    // Positivo para captar más luz
      brightness: 0.5,              // Aumentado para luz ambiente
      whiteBalanceMode: "manual",
      colorTemperature: 3300,       // Optimizado para captar rojo
      torch: false                  // Sin linterna
    }]
  };

  // OPTIMIZACIÓN: Inicialización de cámara mejorada
  const initializeCamera = useCallback(async () => {
    try {
      setIsInitializing(true);
      setHasError(false);

      if (!webcamRef.current) return;

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false
      });

      const track = stream.getVideoTracks()[0];
      
      // OPTIMIZACIÓN: Verificar capacidades
      const capabilities = track.getCapabilities();
      console.log('Capacidades de la cámara:', capabilities);

      // OPTIMIZACIÓN: Aplicar configuración óptima
      await track.applyConstraints({
        advanced: [{
          exposureMode: "manual",
          exposureTime: 2000,
          exposureCompensation: 1.0,
          brightness: 0.5
        }]
      });

      setIsInitializing(false);

    } catch (error) {
      console.error('Error inicializando cámara:', error);
      setHasError(true);
      setIsInitializing(false);
      
      toast({
        title: "Error de cámara",
        description: "Verifique los permisos de la cámara",
        variant: "destructive",
        className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
      });
    }
  }, [toast]);

  // OPTIMIZACIÓN: Procesamiento de frames mejorado
  const processFrame = useCallback(() => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: false
    });

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      // OPTIMIZACIÓN: Ajuste de dimensiones
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // OPTIMIZACIÓN: Procesamiento de región central
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const regionSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.3);
      
      const frameData = context.getImageData(
        centerX - regionSize,
        centerY - regionSize,
        regionSize * 2,
        regionSize * 2
      );

      if (frameData && frameData.data.length >= 4) {
        onFrame(frameData);
        setFrameCount(prev => prev + 1);
      }

    } catch (error) {
      console.error("Error procesando frame:", error);
      toast({
        title: "Error de procesamiento",
        description: "Error al procesar la imagen",
        variant: "destructive",
        className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
      });
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  }, [isActive, onFrame, toast]);

  // OPTIMIZACIÓN: Efectos mejorados
  useEffect(() => {
    if (isActive) {
      initializeCamera();
    }
  }, [isActive, initializeCamera]);

  useEffect(() => {
    if (isActive && !isInitializing && !hasError) {
      processFrame();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive, isInitializing, hasError, processFrame]);

  // OPTIMIZACIÓN: Renderizado mejorado
  return (
    <div className="relative w-full h-screen bg-black">
      {isActive && (
        <>
          <Webcam
            ref={webcamRef}
            audio={false}
            videoConstraints={videoConstraints}
            className="absolute w-full h-full object-cover z-0"
            screenshotFormat="image/jpeg"
            screenshotQuality={1}
          />

          <canvas 
            ref={canvasRef} 
            style={{ display: "none" }}
          />

          {/* OPTIMIZACIÓN: Guía visual mejorada */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="relative w-32 h-32">
              {/* Círculo guía */}
              <div className={cn(
                "absolute inset-0 border-2 rounded-full transition-all duration-300",
                frameCount > 0 ? "border-white/30" : "border-white/10"
              )} />
              
              {/* Líneas de referencia */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-full h-[1px] bg-white/20" />
              </div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[1px] h-full bg-white/20" />
              </div>
              
              {/* Texto de instrucción */}
              <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                <span className="text-white/60 text-xs text-center">
                  {isInitializing ? "Iniciando cámara..." :
                   hasError ? "Error de cámara" :
                   "Coloque su dedo"}
                </span>
                {!isInitializing && !hasError && (
                  <span className="text-white/40 text-[10px] text-center mt-1">
                    Cubra el círculo
                  </span>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {/* OPTIMIZACIÓN: Estados de error/carga */}
      {isInitializing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <span className="text-white/60 text-sm">
            Iniciando cámara...
          </span>
        </div>
      )}

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black">
          <span className="text-red-400/60 text-sm">
            Error al iniciar la cámara
          </span>
        </div>
      )}
    </div>
  );
};

export default CameraView;
