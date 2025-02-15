
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { useToast } from "@/hooks/use-toast";
import { Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

// Extendemos la interfaz MediaTrackConstraintSet para incluir torch
declare global {
  interface MediaTrackConstraintSet {
    torch?: boolean;
  }
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const [videoInitialized, setVideoInitialized] = useState(false);
  const isMobile = useIsMobile();
  const isAndroid = /android/i.test(navigator.userAgent);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const getDeviceConstraints = () => {
    const constraints: MediaTrackConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: isAndroid ? "environment" : "user",
      advanced: isAndroid ? [{ torch: true }] : undefined
    };

    return constraints;
  };

  const handleCameraError = (error: any) => {
    console.error('Error de cámara:', error);
    let errorMessage = "Error al acceder a la cámara";
    
    if (error.name === 'NotAllowedError') {
      errorMessage = "Por favor, permite el acceso a la cámara para continuar";
    } else if (error.name === 'NotFoundError') {
      errorMessage = "No se encontró ninguna cámara disponible";
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
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
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

    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
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

          // Configurar la linterna para Android
          if (isAndroid) {
            const track = mediaStream.getVideoTracks()[0];
            
            try {
              await track.applyConstraints({
                advanced: [{ torch: true }]
              });
              console.log('Linterna activada exitosamente');
            } catch (torchError) {
              console.warn('No se pudo activar la linterna:', torchError);
              toast({
                title: "Aviso",
                description: "Por favor, asegúrate de tener buena iluminación para la medición."
              });
            }
          }
          
          setCameraError(null);
          setVideoInitialized(false);
          processFrame();
        } else {
          // Desactivar la linterna y detener la transmisión
          if (mediaStream) {
            const track = mediaStream.getVideoTracks()[0];
            if (isAndroid) {
              try {
                await track.applyConstraints({
                  advanced: [{ torch: false }]
                });
              } catch (error) {
                console.warn('Error al desactivar la linterna:', error);
              }
            }
            mediaStream.getTracks().forEach(track => track.stop());
          }
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
        }
      } catch (error) {
        handleCameraError(error);
      }
    };

    setupCamera();

    return () => {
      if (mediaStream) {
        const track = mediaStream.getVideoTracks()[0];
        if (isAndroid) {
          track.applyConstraints({
            advanced: [{ torch: false }]
          }).catch(console.warn);
        }
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
            forceScreenshotSourceSize
            onUserMediaError={handleCameraError}
          />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
