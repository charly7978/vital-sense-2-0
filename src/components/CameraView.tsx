
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { useToast } from "@/hooks/use-toast";
import { Camera } from 'lucide-react';

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const [videoInitialized, setVideoInitialized] = useState(false);

  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA || !video.videoWidth || !video.videoHeight) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // Solo actualiza las dimensiones del canvas si han cambiado
    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      setVideoInitialized(true);
    }

    try {
      // Dibuja el frame
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      
      // Solo procesa si el canvas tiene dimensiones válidas
      if (canvas.width > 0 && canvas.height > 0) {
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        onFrame(imageData);
      }
    } catch (error) {
      console.error('Error processing video frame:', error);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    if (isActive) {
      setVideoInitialized(false);
      animationFrameRef.current = requestAnimationFrame(processFrame);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/5 backdrop-blur-sm">
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {isActive && (
          <Webcam
            ref={webcamRef}
            className="w-full h-full object-cover"
            videoConstraints={{
              width: 640,
              height: 480,
              facingMode: "user"
            }}
          />
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
