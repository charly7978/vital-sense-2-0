
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

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
  const lastProcessTime = useRef<number>(0);
  const processingInterval = 33; // ~30fps máximo para evitar sobrecarga
  const { toast } = useToast();
  const [videoInitialized, setVideoInitialized] = useState(false);
  const isMobile = useIsMobile();
  const isAndroid = /android/i.test(navigator.userAgent);

  const getDeviceConstraints = () => {
    return {
      width: { ideal: 640 }, // Reducido para mejor rendimiento
      height: { ideal: 480 }, // Reducido para mejor rendimiento
      facingMode: isAndroid ? "environment" : "user",
      advanced: isAndroid ? [{ torch: true }] : undefined,
    };
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

      const now = performance.now();
      const timeSinceLastProcess = now - lastProcessTime.current;

      if (timeSinceLastProcess >= processingInterval) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d', { willReadFrequently: true });

        if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
          animationFrameRef.current = requestAnimationFrame(processFrame);
          return;
        }

        // Redimensionar el canvas solo si es necesario
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          setVideoInitialized(true);
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frameData = context.getImageData(0, 0, canvas.width, canvas.height);
        onFrame(frameData);
        lastProcessTime.current = now;
      }

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

      if (webcamRef.current?.video) {
        const stream = webcamRef.current.video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach(track => track.stop());
        }
      }
    };
  }, [isActive]);

  if (!isActive) {
    return null;
  }

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
