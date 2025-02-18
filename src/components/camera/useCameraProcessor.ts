
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
  const frameCountRef = useRef<number>(0);

  const processFrame = useCallback((
    webcamRef: React.RefObject<Webcam>,
    canvasRef: React.RefObject<HTMLCanvasElement>
  ) => {
    if (!isActive) {
      console.log('Procesamiento inactivo');
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    if (!webcamRef.current?.video || !canvasRef.current) {
      console.log('Referencias no disponibles:', {
        hasVideo: !!webcamRef.current?.video,
        hasCanvas: !!canvasRef.current
      });
      animationFrameRef.current = requestAnimationFrame(() => processFrame(webcamRef, canvasRef));
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    
    // Asegurarse de que el video esté reproduciendo
    if (video.paused || video.ended || !video.videoWidth) {
      console.log('Video no está activo:', {
        paused: video.paused,
        ended: video.ended,
        width: video.videoWidth
      });
      animationFrameRef.current = requestAnimationFrame(() => processFrame(webcamRef, canvasRef));
      return;
    }

    const context = canvas.getContext('2d', { 
      willReadFrequently: true,
      alpha: false
    });

    if (!context) {
      console.error('No se pudo obtener el contexto del canvas');
      return;
    }

    // Verificar que el video tenga datos
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.log('Esperando datos del video:', video.readyState);
      animationFrameRef.current = requestAnimationFrame(() => processFrame(webcamRef, canvasRef));
      return;
    }

    // Evitar procesamiento simultáneo
    if (processingRef.current) {
      animationFrameRef.current = requestAnimationFrame(() => processFrame(webcamRef, canvasRef));
      return;
    }

    processingRef.current = true;

    try {
      // Actualizar dimensiones del canvas si es necesario
      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        console.log('Canvas redimensionado:', {
          width: canvas.width,
          height: canvas.height
        });
      }

      // Dibujar frame actual
      context.drawImage(video, 0, 0);

      // Obtener región central
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const regionSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.4);

      const frameData = context.getImageData(
        centerX - regionSize,
        centerY - regionSize,
        regionSize * 2,
        regionSize * 2
      );

      // Procesar frame
      onFrame(frameData);
      
      // Actualizar contador de frames
      frameCountRef.current += 1;
      if (frameCountRef.current % 30 === 0) { // Log cada 30 frames
        console.log('Frames procesados:', frameCountRef.current);
      }
      setFrameCount(prev => prev + 1);

    } catch (error) {
      console.error('Error procesando frame:', error);
      toast({
        title: "Error de procesamiento",
        description: "Error al procesar la imagen",
        variant: "destructive",
        className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
      });
    } finally {
      processingRef.current = false;
      // Continuar el ciclo de procesamiento
      animationFrameRef.current = requestAnimationFrame(() => processFrame(webcamRef, canvasRef));
    }
  }, [isActive, onFrame, setFrameCount, toast]);

  return {
    processFrame,
    animationFrameRef
  };
};
