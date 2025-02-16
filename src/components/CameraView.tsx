import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

// Extensión de interfaz para controlar la linterna (torch)
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

  // Configuración de la cámara
  const getDeviceConstraints = () => {
    const constraints: MediaTrackConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: isAndroid ? "environment" : "user",
      advanced: isAndroid ? [{ torch: true }] : undefined,
    };
    return constraints;
  };

  // Procesamiento de cada frame del video
  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Asegurar que la resolución del canvas coincide con el video
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setVideoInitialized(true);
    }

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameData = context.getImageData(0, 0, canvas.width, canvas.height);

      // Detección mejorada de dedo basado en tonos de piel
      const isFingerDetected = detectFinger(frameData);

      if (isFingerDetected) {
        console.log("Dedo detectado!");
      }

      // Análisis de variaciones de color para signos vitales
      analyzeVitalSigns(frameData);

      onFrame(frameData);
    } catch (error) {
      console.error("Error al procesar el frame:", error);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  // Detección de dedo basada en tonos de piel
  const detectFinger = (imageData: ImageData): boolean => {
    let skinPixels = 0;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      // Filtro de color para detectar tonos de piel
      if (r > 95 && g > 40 && b > 20 && r > g && r > b) {
        skinPixels++;
      }
    }

    return skinPixels > 5000; // Umbral ajustable
  };

  // Análisis de signos vitales basado en variaciones de color
  const analyzeVitalSigns = (imageData: ImageData) => {
    const data = imageData.data;
    let redTotal = 0;
    let greenTotal = 0;
    let blueTotal = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      redTotal += data[i];
      greenTotal += data[i + 1];
      blueTotal += data[i + 2];
      pixelCount++;
    }

    const avgRed = redTotal / pixelCount;
    const avgGreen = greenTotal / pixelCount;
    const avgBlue = blueTotal / pixelCount;

    console.log("Valores de color promedio:", { avgRed, avgGreen, avgBlue });

    // Se puede usar la variación en la intensidad del color para estimar signos vitales
  };

  useEffect(() => {
    if (isActive) {
      processFrame();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [isActive]);

  return (
    <div className="relative">
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={getDeviceConstraints()}
        className="w-full h-auto"
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default CameraView;
