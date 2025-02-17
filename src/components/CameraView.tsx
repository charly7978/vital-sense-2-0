
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

interface ExtendedTrackConstraints extends MediaTrackConstraints {
  advanced?: Array<{ [key: string]: any }>;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const [videoInitialized, setVideoInitialized] = useState(false);
  const isMobile = useIsMobile();
  const isAndroid = /android/i.test(navigator.userAgent);

  useEffect(() => {
    let stream: MediaStream | null = null;

    const initializeCamera = async () => {
      if (!isActive) return;

      try {
        const constraints: ExtendedTrackConstraints = {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: isAndroid ? "environment" : "user",
        };

        if (isAndroid) {
          // Agregamos configuración específica para Android
          constraints.advanced = [
            { 
              // Reducimos la intensidad de la linterna
              torch: true,
              // Ajustamos exposición y brillo para compensar
              exposureMode: 'manual',
              exposureTime: 1000, // Tiempo de exposición más largo
              brightness: 0.5, // Reducimos el brillo
              contrast: 1.2 // Aumentamos un poco el contraste
            }
          ];
        }

        stream = await navigator.mediaDevices.getUserMedia({ video: constraints });
        
        if (webcamRef.current && webcamRef.current.video) {
          webcamRef.current.video.srcObject = stream;
          const track = stream.getVideoTracks()[0];
          
          if (isAndroid && track.getCapabilities) {
            const capabilities = track.getCapabilities() as any;
            if (capabilities?.torch) {
              await track.applyConstraints(constraints);
              console.log('✓ Cámara Android configurada con ajustes optimizados');
            }
          }
        }
      } catch (error) {
        console.error('Error iniciando cámara:', error);
        toast({
          variant: "destructive",
          title: "Error de cámara",
          description: "No se pudo acceder a la cámara. Por favor, verifique los permisos."
        });
      }
    };

    const cleanup = () => {
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };

    if (isActive) {
      initializeCamera();
    } else {
      cleanup();
    }

    return cleanup;
  }, [isActive, isAndroid, toast]);

  useEffect(() => {
    const processFrame = () => {
      if (!isActive || !webcamRef.current?.video || !canvasRef.current) return;

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
      onFrame(frameData);

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    if (isActive) {
      processFrame();
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, onFrame]);

  if (!isActive) return null;

  return (
    <div className="relative w-full h-full">
      <Webcam
        ref={webcamRef}
        audio={false}
        className="w-full h-full object-cover rounded-lg"
        screenshotFormat="image/jpeg"
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default CameraView;
