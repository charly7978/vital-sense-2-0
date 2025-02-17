
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
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
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: isAndroid ? "environment" : "user",
    advanced: isAndroid ? [{ torch: isMeasuring }] : undefined,
  });

  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      if (isActive) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
      }
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      // Ajustar el tamaño del canvas al video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // Dibujar el frame actual en el canvas
      context.drawImage(video, 0, 0);
      
      // Obtener los datos de imagen del área central
      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const regionSize = Math.min(canvas.width, canvas.height) * 0.4;
      
      const frameData = context.getImageData(
        centerX - regionSize / 2,
        centerY - regionSize / 2,
        regionSize,
        regionSize
      );

      // Enviar los datos del frame al procesador PPG
      onFrame(frameData);
    } catch (error) {
      console.error("Error al procesar el frame:", error);
      toast({
        variant: "destructive",
        title: "Error de cámara",
        description: "No se pudo procesar la imagen de la cámara."
      });
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    if (isActive) {
      setIsMeasuring(true);
      processFrame();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      setIsMeasuring(false);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isActive]);

  return (
    <div className="relative">
      {isActive && (
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={getDeviceConstraints()}
          className="w-full h-auto rounded-lg"
        />
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default CameraView;
