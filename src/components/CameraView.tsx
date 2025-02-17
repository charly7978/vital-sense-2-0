
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
  onMeasurementEnd?: () => void;
}

declare global {
  interface MediaTrackConstraintSet {
    torch?: boolean;
  }
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isActive, onMeasurementEnd }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const isMobile = useIsMobile();
  const isAndroid = /android/i.test(navigator.userAgent);

  const getDeviceConstraints = () => ({
    width: { ideal: 640 },
    height: { ideal: 480 },
    facingMode: isAndroid ? "environment" : "user",
    advanced: isAndroid ? [{ torch: isMeasuring }] : undefined,
  });

  const processFrame = () => {
    if (!isActive) {
      return;
    }

    const video = webcamRef.current?.video;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');

    if (!video || !canvas || !context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      // Ajustar el tamaño del canvas al video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Dibujar el frame en el canvas
      context.drawImage(video, 0, 0);

      // Obtener los datos de la imagen
      const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      // Procesar el frame solo si hay datos válidos
      if (frameData && frameData.data.length > 0) {
        onFrame(frameData);
      }
    } catch (error) {
      console.error("Error al procesar frame:", error);
      toast({
        variant: "destructive",
        title: "Error de cámara",
        description: "Hubo un problema al procesar la imagen de la cámara."
      });
    }

    // Continuar el ciclo de procesamiento
    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  };

  useEffect(() => {
    // Iniciar o detener el procesamiento según isActive
    if (isActive) {
      setIsMeasuring(true);
      processFrame();
    } else {
      setIsMeasuring(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    // Limpieza al desmontar
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive]);

  return (
    <div className="relative w-full">
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={getDeviceConstraints()}
        className="w-full h-auto rounded-lg"
      />
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default CameraView;
