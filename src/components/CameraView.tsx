import React, { useRef, useEffect, useState } from 'react';
import { MediaTrackConstraints } from '@/types/vitals';

interface CameraViewProps {  
  onFrame: (frame: ImageData) => void;
  enabled: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({
  onFrame,
  enabled
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [hasError, setHasError] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  const constraints: MediaStreamConstraints = {
    video: {
      width: 1280,
      height: 720,
      facingMode: "user",
      frameRate: 30,
      aspectRatio: 16/9,
      advanced: [{
        exposureMode: "manual",
        exposureTime: 10000,
        exposureCompensation: 2,
        brightness: 1.0,
        contrast: 1.2,
        whiteBalanceMode: "manual",
        colorTemperature: 3300,
        saturation: 1.5,
        sharpness: 1.2,
        torch: false
      }]
    } as MediaTrackConstraints
  };

  useEffect(() => {
    let animationFrameId: number;

    const startCamera = async () => {
      setHasError(false);
      try {
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        setStream(stream);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();

          const track = stream.getVideoTracks()[0];
          await track.applyConstraints({
            advanced: [{
              exposureMode: "manual",
              exposureTime: 10000,
              exposureCompensation: 2,
              brightness: 1.0,
              contrast: 1.2
            }]
          });

          processFrame();
        }
      } catch (error: any) {
        console.error("Error accessing the camera:", error);
        setHasError(true);
      }
    };

    const stopCamera = () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        setStream(null);
      }
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
      }
      cancelAnimationFrame(animationFrameId);
    };

    const processFrame = () => {
      if (!videoRef.current || !canvasRef.current) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        console.error('Canvas context not available');
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const centerX = Math.floor(canvas.width / 2);
      const centerY = Math.floor(canvas.height / 2);
      const regionSize = Math.floor(Math.min(canvas.width, canvas.height) * 0.4);

      context.filter = 'contrast(120%) brightness(120%) saturate(120%)';
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      context.filter = 'none';
      
      const frameData = context.getImageData(
        centerX - regionSize,
        centerY - regionSize,
        regionSize * 2,
        regionSize * 2
      );

      if (frameData && frameData.data.length >= 4) {
        for (let i = 0; i < frameData.data.length; i += 4) {
          frameData.data[i] = Math.min(frameData.data[i] * 1.2, 255);
        }
        
        onFrame(frameData);
        setFrameCount(prev => prev + 1);
      }

      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (enabled) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [onFrame, enabled]);

  return (
    <div className="relative w-full h-full">
      <video ref={videoRef} className="hidden" playsInline muted />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black text-red-500">
          Error: No se puede acceder a la cámara.
        </div>
      )}
    </div>
  );
};

export default CameraView;
