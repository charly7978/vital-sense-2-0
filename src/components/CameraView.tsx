
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
    zoom?: number;
    exposureMode?: string;
    exposureCompensation?: number;
    brightness?: number;
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

  const getDeviceConstraints = (): MediaTrackConstraints => ({
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: isAndroid ? "environment" : "user",
    advanced: isAndroid 
      ? [
          {
            torch: isMeasuring,
            zoom: 1
          }
        ] 
      : [
          {
            exposureMode: "manual",
            exposureCompensation: -1.0,
            brightness: 0.3
          }
        ],
  });

  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0);
      
      const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
      
      if (frameData && frameData.data.length > 0) {
        onFrame(frameData);
      }
    } catch (error) {
      console.error("Error al procesar frame:", error);
      if (isActive) {
        toast({
          variant: "destructive",
          title: "Error de cámara",
          description: "Hubo un problema al procesar la imagen de la cámara."
        });
      }
    }

    if (isActive) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  };

  const stopCamera = () => {
    if (webcamRef.current?.video?.srcObject) {
      const tracks = (webcamRef.current.video.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsMeasuring(false);
  };

  useEffect(() => {
    if (isActive) {
      setIsMeasuring(true);
      processFrame();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  if (!isActive) {
    return null;
  }

  return (
    <div className="relative w-full h-full">
      <Webcam
        ref={webcamRef}
        audio={false}
        videoConstraints={getDeviceConstraints()}
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas 
        ref={canvasRef} 
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default CameraView;
