
import React, { useRef, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

interface CameraProcessorProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
  cameraInitialized: boolean;
}

const CameraProcessor: React.FC<CameraProcessorProps> = ({
  videoRef,
  onFrame,
  isActive,
  cameraInitialized,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const processingRef = useRef(false);
  const { toast } = useToast();
  const frameCountRef = useRef(0);

  useEffect(() => {
    let animationFrameId: number;
    let mounted = true;

    const processFrame = () => {
      if (!mounted || !isActive || !cameraInitialized || processingRef.current) {
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');

      if (!video || !canvas || !context || video.readyState !== video.HAVE_ENOUGH_DATA) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      processingRef.current = true;

      try {
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          console.log('Canvas dimensions updated:', canvas.width, canvas.height);
        }

        context.drawImage(video, 0, 0);
        const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
        
        frameCountRef.current++;
        if (frameCountRef.current % 30 === 0) {
          console.log('Processing frame:', frameCountRef.current, 
                      'Dimensions:', canvas.width, 'x', canvas.height);
        }
        
        onFrame(imageData);

      } catch (error) {
        console.error('Frame processing error:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Error al procesar imagen de la cámara"
        });
      } finally {
        processingRef.current = false;
        if (mounted && isActive) {
          animationFrameId = requestAnimationFrame(processFrame);
        }
      }
    };

    if (isActive && cameraInitialized) {
      console.log('Starting frame processing');
      animationFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      mounted = false;
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, cameraInitialized, onFrame, videoRef, toast]);

  return <canvas ref={canvasRef} className="hidden" />;
};

export default CameraProcessor;
