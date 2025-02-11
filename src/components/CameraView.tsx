
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

  const getDeviceConstraints = () => {
    const constraints: MediaTrackConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: isAndroid ? "environment" : "user",
      advanced: isAndroid ? [{ torch: true }] : undefined
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

          // Configurar la linterna para Android
          if (isAndroid) {
            const track = mediaStream.getVideoTracks()[0];
            
            // Intentar activar la linterna
            try {
              await track.applyConstraints({
                advanced: [{ torch: true }]
              });
              console.log('Linterna activada exitosamente');
            } catch (torchError) {
              console.error('Error al activar la linterna:', torchError);
              toast({
                title: "Aviso",
                description: "Por favor, asegúrate de tener buena iluminación para la medición."
              });
            }
          }
          
          setVideoInitialized(false);
          animationFrameRef.current = requestAnimationFrame(processFrame);
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
                console.error('Error al desactivar la linterna:', error);
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
        const track = mediaStream.getVideoTracks()[0];
        if (isAndroid) {
          track.applyConstraints({
            advanced: [{ torch: false }]
          }).catch(console.error);
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
