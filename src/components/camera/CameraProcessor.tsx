
import React, { useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface CameraProcessorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
  cameraInitialized: boolean;
}

const CameraProcessor: React.FC<CameraProcessorProps> = ({
  videoRef,
  onFrame,
  isActive,
  cameraInitialized,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef(false);
  const { toast } = useToast();

  useEffect(() => {
    let animationFrameId: number;
    let lastProcessTime = 0;
    const frameInterval = 33; // Aproximadamente 30 FPS

    const processFrame = (timestamp: number) => {
      if (!isActive || !cameraInitialized) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      // Controlar la tasa de frames
      if (timestamp - lastProcessTime < frameInterval) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');

      if (!video || !canvas || !context) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      if (video.readyState === video.HAVE_ENOUGH_DATA) {
        if (!processingRef.current) {
          processingRef.current = true;

          try {
            // Asegurar que el canvas tenga las dimensiones correctas
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
            }

            context.drawImage(video, 0, 0);
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            onFrame(imageData);
            lastProcessTime = timestamp;

          } catch (error) {
            console.error('Error procesando frame:', error);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Error al procesar imagen de la cámara"
            });
          } finally {
            processingRef.current = false;
          }
        }
      }

      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (isActive && cameraInitialized) {
      console.log('Iniciando procesamiento de frames');
      animationFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, onFrame, cameraInitialized, videoRef, toast]);

  return <canvas ref={canvasRef} className="hidden" />;
};

export default CameraProcessor;
