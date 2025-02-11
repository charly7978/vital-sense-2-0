
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
  const frameCountRef = useRef(0);

  useEffect(() => {
    let animationFrameId: number;
    let lastProcessTime = 0;
    const PROCESS_INTERVAL = 33; // ~30 FPS

    const processFrame = () => {
      const now = Date.now();
      
      if (!isActive || !cameraInitialized || processingRef.current || 
          now - lastProcessTime < PROCESS_INTERVAL) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');

      if (!video || !canvas || !context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      processingRef.current = true;
      lastProcessTime = now;

      try {
        // Asegurar que las dimensiones coincidan
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          console.log('Dimensiones de canvas actualizadas:', canvas.width, canvas.height);
        }

        context.drawImage(video, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        frameCountRef.current++;
        if (frameCountRef.current % 30 === 0) {
          console.log('Procesando frame:', frameCountRef.current, 
                      'Dimensiones:', canvas.width, 'x', canvas.height);
        }
        
        onFrame(imageData);

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
  }, [isActive, cameraInitialized, onFrame, videoRef, toast]);

  return <canvas ref={canvasRef} className="hidden" />;
};

export default CameraProcessor;
