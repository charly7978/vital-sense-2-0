
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
  const isAndroid = /android/i.test(navigator.userAgent);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraReady, setCameraReady] = useState(false);

  const getDeviceConstraints = () => {
    const constraints: MediaTrackConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: isMobile ? "environment" : "user"
    };

    if (isAndroid) {
      constraints.advanced = [{ torch: true }];
    }

    return constraints;
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

  const enableFlash = async () => {
    if (!mediaStreamRef.current || !isAndroid) return;

    try {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: true }]
      });
      setFlashEnabled(true);
      console.log('Linterna activada');
    } catch (error) {
      console.warn('No se pudo activar la linterna:', error);
      toast({
        title: "Aviso",
        description: "Asegúrate de tener buena iluminación para la medición"
      });
    }
  };

  const disableFlash = async () => {
    if (!mediaStreamRef.current || !isAndroid) return;

    try {
      const track = mediaStreamRef.current.getVideoTracks()[0];
      await track.applyConstraints({
        advanced: [{ torch: false }]
      });
      setFlashEnabled(false);
      console.log('Linterna desactivada');
    } catch (error) {
      console.warn('Error al desactivar la linterna:', error);
    }
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

    // Ajustar dimensiones del canvas si es necesario
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
        const constraints = getDeviceConstraints();
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: constraints,
          audio: false 
        });

        mediaStreamRef.current = stream;

        if (webcamRef.current && webcamRef.current.video) {
          webcamRef.current.video.srcObject = stream;
          setCameraReady(true);
        }

        if (isAndroid) {
          await enableFlash();
        }

        setCameraError(null);
        processFrame();
      }
    } catch (error) {
      handleCameraError(error);
    }
  };

  const cleanupCamera = async () => {
    if (mediaStreamRef.current) {
      if (isAndroid && flashEnabled) {
        await disableFlash();
      }
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
