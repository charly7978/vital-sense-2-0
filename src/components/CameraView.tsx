
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

// Extendemos la interfaz correctamente
declare global {
  interface MediaTrackConstraintSet {
    torch?: boolean;
  }
  
  interface MediaTrackCapabilities {
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
      advanced: isAndroid ? [{ torch: true }] : undefined,
    };
    return constraints;
  };

  const toggleTorch = async (enable: boolean) => {
    if (!isAndroid || !webcamRef.current?.video) return;

    try {
      const track = (webcamRef.current.video.srcObject as MediaStream)
        ?.getVideoTracks()[0];

      if (track?.getCapabilities?.()?.torch) {
        await track.applyConstraints({
          advanced: [{ torch: enable }],
        });
        console.log(`Linterna ${enable ? 'activada' : 'desactivada'}`);
      }
    } catch (error) {
      console.error('Error al controlar la linterna:', error);
    }
  };

  useEffect(() => {
    const processFrame = () => {
      if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
        return;
      }

      const video = webcamRef.current.video;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        setVideoInitialized(true);
      }

      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
      onFrame(frameData);

      animationFrameRef.current = requestAnimationFrame(processFrame);
    };

    if (isActive) {
      processFrame();
      toggleTorch(true);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      toggleTorch(false);

      // Cerrar la cámara cuando se desactiva
      if (webcamRef.current?.video) {
        const stream = webcamRef.current.video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      toggleTorch(false);
    };
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
