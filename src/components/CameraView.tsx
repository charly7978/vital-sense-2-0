
import React, { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { toast } from '@/components/ui/use-toast';
import { MediaTrackConstraintsExtended } from '@/types';

interface CameraViewProps {
  onImageCapture: (imageData: ImageData) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onImageCapture }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState(false);

  useEffect(() => {
    initializeCamera();
  }, []);

  const initializeCamera = async () => {
    try {
      const constraints: MediaTrackConstraintsExtended = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: { ideal: 'environment' }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setHasPermission(true);
        
        if (canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth;
          canvasRef.current.height = videoRef.current.videoHeight;
        }
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara. Por favor, verifica los permisos.",
        variant: "destructive"
      });
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const context = canvasRef.current.getContext('2d');
    if (!context) return;

    try {
      context.drawImage(
        videoRef.current,
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      const imageData = context.getImageData(
        0,
        0,
        canvasRef.current.width,
        canvasRef.current.height
      );

      onImageCapture(imageData);
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <video
        ref={videoRef}
        className="w-full h-auto"
        playsInline
        muted
      />
      <canvas
        ref={canvasRef}
        className="hidden"
      />
      {!hasPermission && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
          <Button onClick={initializeCamera}>
            Activar Cámara
          </Button>
        </div>
      )}
    </Card>
  );
};

export default CameraView;
