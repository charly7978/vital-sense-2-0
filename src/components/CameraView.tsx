
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

// Extendemos la interfaz MediaTrackConstraints para incluir torch
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
          constraints.advanced = [{ torch: true }];
        }

        stream = await navigator.mediaDevices.getUserMedia({ video: constraints });
        
        if (webcamRef.current && webcamRef.current.video) {
          webcamRef.current.video.srcObject = stream;
          const track = stream.getVideoTracks()[0];
          
          // Usar type assertion para acceder a torch
          const capabilities = track.getCapabilities() as any;
          if (isAndroid && capabilities?.torch) {
            const torchConstraints = {
              advanced: [{ torch: true }]
            } as unknown as MediaTrackConstraints;
            
            await track.applyConstraints(torchConstraints);
            console.log('✓ Linterna activada');
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
