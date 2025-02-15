
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { useToast } from "@/hooks/use-toast";
import { Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const { toast } = useToast();
  const [videoInitialized, setVideoInitialized] = useState(false);
  const isMobile = useIsMobile();
  const [cameraError, setCameraError] = useState<string | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const getDeviceConstraints = () => {
    return {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: isMobile ? "environment" : "user"
    };
  };

  const handleCameraError = (error: any) => {
    console.error('Error de cámara:', error);
    let errorMessage = "Error al acceder a la cámara";

    if (error.name === 'NotAllowedError') {
      errorMessage = "Por favor, permite el acceso a la cámara";
    } else if (error.name === 'NotFoundError') {
      errorMessage = "No se encontró ninguna cámara";
    } else if (error.name === 'NotReadableError') {
      errorMessage = "La cámara está siendo usada por otra aplicación";
    }

    setCameraError(errorMessage);
    toast({
      variant: "destructive",
      title: "Error de cámara",
      description: errorMessage
    });
  };

  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current || !cameraReady) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setVideoInitialized(true);
    }

    try {
      context.drawImage(video, 0, 0);
      const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
      onFrame(frameData);
    } catch (error) {
      console.error('Error procesando frame:', error);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  const setupCamera = async () => {
    try {
      if (isActive && !mediaStreamRef.current) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: getDeviceConstraints(),
          audio: false 
        });

        mediaStreamRef.current = stream;

        if (webcamRef.current && webcamRef.current.video) {
          webcamRef.current.video.srcObject = stream;
          setCameraReady(true);
        }

        setCameraError(null);
        processFrame();
      }
    } catch (error) {
      handleCameraError(error);
    }
  };

  const cleanupCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    setCameraReady(false);
  };

  useEffect(() => {
    if (isActive) {
      setupCamera();
    } else {
      cleanupCamera();
    }

    return () => {
      cleanupCamera();
    };
  }, [isActive]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/5 backdrop-blur-sm">
        {!isActive && !cameraError && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {cameraError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <Camera className="w-8 h-8 text-red-400 mb-2" />
            <p className="text-sm text-red-400">{cameraError}</p>
          </div>
        )}
        {isActive && !cameraError && (
          <Webcam
            ref={webcamRef}
            className="w-full h-full object-cover"
            videoConstraints={getDeviceConstraints()}
            onUserMediaError={handleCameraError}
          />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
