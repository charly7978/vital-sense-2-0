
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
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const [videoInitialized, setVideoInitialized] = useState(false);
  const isMobile = useIsMobile();
  const isAndroid = /android/i.test(navigator.userAgent);

  const getDeviceConstraints = () => {
    const constraints: MediaTrackConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: isAndroid ? "environment" : "user",
      // Configuración para mejor calidad de imagen
      exposureMode: "manual",
      exposureCompensation: 2.0, // Aumentar exposición
      whiteBalanceMode: "manual",
      brightness: 1.0,
      contrast: 1.0
    };

    return constraints;
  };

  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA || !video.videoWidth || !video.videoHeight) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setVideoInitialized(true);
    }

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      if (canvas.width > 0 && canvas.height > 0) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        onFrame(imageData);
      }
    } catch (error) {
      console.error('Error processing video frame:', error);
      toast({
        variant: "destructive",
        title: "Error en el procesamiento",
        description: "Error al procesar la imagen de la cámara."
      });
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    let mediaStream: MediaStream | null = null;

    const setupCamera = async () => {
      try {
        if (isActive) {
          const constraints = getDeviceConstraints();
          mediaStream = await navigator.mediaDevices.getUserMedia({ 
            video: constraints,
            audio: false 
          });

          if (webcamRef.current) {
            webcamRef.current.video!.srcObject = mediaStream;
          }

          // Aplicar configuraciones avanzadas si está disponible
          const track = mediaStream.getVideoTracks()[0];
          const capabilities = track.getCapabilities();
          const settings: any = {};

          // Intentar ajustar la exposición si está disponible
          if (capabilities.exposureMode) {
            settings.exposureMode = 'manual';
          }
          if (capabilities.exposureTime) {
            settings.exposureTime = capabilities.exposureTime.max / 2;
          }
          if (capabilities.colorTemperature) {
            settings.colorTemperature = 5000; // temperatura de color neutra
          }

          await track.applyConstraints(settings);
          
          setVideoInitialized(false);
          animationFrameRef.current = requestAnimationFrame(processFrame);
        } else {
          if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
          }
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        }
      } catch (error) {
        console.error('Error setting up camera:', error);
        toast({
          variant: "destructive",
          title: "Error de cámara",
          description: "No se pudo inicializar la cámara correctamente."
        });
      }
    };

    setupCamera();

    return () => {
      if (mediaStream) {
        mediaStream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/5 backdrop-blur-sm">
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {isActive && (
          <Webcam
            ref={webcamRef}
            className="w-full h-full object-cover"
            videoConstraints={getDeviceConstraints()}
            forceScreenshotSourceSize
          />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
