
import { useCallback, useRef } from "react";
import type Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";

interface UseCameraProcessorProps {
  isActive: boolean;
  onFrame: (imageData: ImageData) => void;
  setFrameCount: (cb: (prev: number) => number) => void;
}

export const useCameraProcessor = ({ 
  isActive, 
  onFrame, 
  setFrameCount 
}: UseCameraProcessorProps) => {
  const { toast } = useToast();
  const animationFrameRef = useRef<number | null>(null);
  const processingRef = useRef<boolean>(false);

  const processFrame = useCallback((
    webcamRef: React.RefObject<Webcam>,
    canvasRef: React.RefObject<HTMLCanvasElement>
  ) => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      console.log('Condiciones iniciales no cumplidas:', {
        isActive,
        hasVideo: !!webcamRef.current?.video,
        hasCanvas: !!canvasRef.current
      });
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: false
    });

    if (!context) {
      console.error('No se pudo obtener el contexto del canvas');
      return;
    }

    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log('Video no tiene suficientes datos:', video.readyState);
      animationFrameRef.current = requestAnimationFrame(() => processFrame(webcamRef, canvasRef));
      return;
    }

    // Evitar procesamiento simultáneo
    if (processingRef.current) {
      console.log('Frame anterior aún en proceso');
      animationFrameRef.current = requestAnimationFrame(() => processFrame(webcamRef, canvasRef));
      return;
    }

    processingRef.current = true;

    try {
      console.log('Procesando frame...', {
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight
      });

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const regionSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.4);

      // Mejoras para captura sin linterna
      context.filter = 'brightness(150%) contrast(120%) saturate(120%)';
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.filter = 'none';
      
      const frameData = context.getImageData(
        centerX - regionSize,
        centerY - regionSize,
        regionSize * 2,
        regionSize * 2
      );

      // Amplificación del canal rojo
      if (frameData && frameData.data.length >= 4) {
        for (let i = 0; i < frameData.data.length; i += 4) {
          frameData.data[i] = Math.min(frameData.data[i] * 1.2, 255);
        }
        
        onFrame(frameData);
        setFrameCount(prev => prev + 1);
        console.log('Frame procesado exitosamente');
      }

    } catch (error) {
      console.error("Error procesando frame:", error);
      toast({
        title: "Error de procesamiento",
        description: "Error al procesar la imagen",
        variant: "destructive",
        className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
      });
    } finally {
      processingRef.current = false;
      animationFrameRef.current = requestAnimationFrame(() => processFrame(webcamRef, canvasRef));
    }
  }, [isActive, onFrame, setFrameCount, toast]);

  return {
    processFrame,
    animationFrameRef
  };
};
