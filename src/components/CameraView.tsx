
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { useToast } from "@/hooks/use-toast";
import { Camera } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

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
  let videoTrack: MediaStreamTrack | null = null;

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isActive]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", torch: true } // Forzar cámara trasera y linterna encendida
      });

      if (webcamRef.current) {
        webcamRef.current.video!.srcObject = stream;
      }

      videoTrack = stream.getVideoTracks()[0];

      // Intentar activar la linterna al iniciar
      try {
        await videoTrack.applyConstraints({ advanced: [{ torch: true }] });
      } catch (error) {
        console.warn("Linterna no soportada:", error);
      }

      setVideoInitialized(true);
    } catch (error) {
      console.error("Error al acceder a la cámara:", error);
      setCameraError("No se pudo acceder a la cámara. Asegúrate de haber otorgado permisos.");
    }
  };

  const stopCamera = () => {
    if (videoTrack) {
      // Apagar la linterna al detener la medición
      try {
        videoTrack.applyConstraints({ advanced: [{ torch: false }] });
      } catch (error) {
        console.warn("No se pudo apagar la linterna:", error);
      }
    }

    if (webcamRef.current?.video?.srcObject) {
      const stream = webcamRef.current.video.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      setVideoInitialized(false);
    }
  };

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center">
      {cameraError ? (
        <p className="text-red-500">{cameraError}</p>
      ) : (
        <Webcam
          ref={webcamRef}
          className="w-full h-auto"
          videoConstraints={{ facingMode: "environment" }}
        />
      )}
    </div>
  );
};

export default CameraView;
