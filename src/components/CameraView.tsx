
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import CameraPreview from "./camera/CameraPreview";
import CameraOverlay from "./camera/CameraOverlay";
import CameraStatus from "./camera/CameraStatus";
import { useCameraProcessor } from "./camera/useCameraProcessor";
import { useCameraInitializer } from "./camera/useCameraInitializer";
import { useToast } from "@/hooks/use-toast";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ 
  onFrame, 
  isActive
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [isFlashlightOn, setIsFlashlightOn] = useState(false);
  const { toast } = useToast();

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: "environment"
  };

  const { initializeCamera } = useCameraInitializer({
    videoConstraints,
    setIsInitializing,
    setHasError
  });

  const { processFrame, animationFrameRef } = useCameraProcessor({
    isActive,
    onFrame,
    setFrameCount
  });

  const toggleFlashlight = async () => {
    if (!webcamRef.current?.video) return;

    try {
      const track = (await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      })).getVideoTracks()[0];

      const capabilities = track.getCapabilities();
      
      // Verificar si el dispositivo tiene linterna
      if (!capabilities.torch) {
        toast({
          title: "Error",
          description: "Este dispositivo no tiene linterna",
          variant: "destructive",
        });
        return;
      }

      const newTorchState = !isFlashlightOn;
      await track.applyConstraints({
        advanced: [{ torch: newTorchState }]
      });

      setIsFlashlightOn(newTorchState);
      
      toast({
        title: newTorchState ? "Linterna encendida" : "Linterna apagada",
        description: "Ajusta la luz según sea necesario",
      });

    } catch (error) {
      console.error('Error al controlar la linterna:', error);
      toast({
        title: "Error",
        description: "No se pudo controlar la linterna",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    let isMounted = true;

    const setupCamera = async () => {
      if (isActive) {
        console.log('Iniciando cámara...');
        setIsInitializing(true);
        const success = await initializeCamera();
        
        if (isMounted) {
          setIsInitializing(false);
          if (success) {
            console.log('Cámara iniciada exitosamente');
            // Intentar encender la linterna automáticamente al iniciar
            await toggleFlashlight();
          }
        }
      }
    };

    setupCamera();

    return () => {
      isMounted = false;
      // Asegurarse de apagar la linterna al desmontar
      if (isFlashlightOn) {
        toggleFlashlight();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, initializeCamera]);

  useEffect(() => {
    if (isActive && !isInitializing && !hasError && webcamRef.current?.video?.readyState === 4) {
      console.log('Iniciando procesamiento de frames...');
      processFrame(webcamRef, canvasRef);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isInitializing, hasError, processFrame]);

  return (
    <div className="relative w-full h-screen bg-black">
      <div className="absolute inset-0">
        {isActive && (
          <>
            <CameraPreview 
              webcamRef={webcamRef}
              videoConstraints={videoConstraints}
            />

            <canvas 
              ref={canvasRef} 
              style={{ display: "none" }}
            />

            <CameraOverlay
              frameCount={frameCount}
              isInitializing={isInitializing}
              hasError={hasError}
            />

            <button
              onClick={toggleFlashlight}
              className="absolute bottom-4 right-4 z-50 p-3 rounded-full bg-black/50 backdrop-blur-sm border border-white/10 text-white/80"
            >
              {isFlashlightOn ? "Apagar Linterna" : "Encender Linterna"}
            </button>
          </>
        )}

        <CameraStatus
          isInitializing={isInitializing}
          hasError={hasError}
        />
      </div>
    </div>
  );
};

export default CameraView;
