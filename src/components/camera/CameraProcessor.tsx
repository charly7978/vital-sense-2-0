
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
  const frameCountRef = useRef(0);
  const { toast } = useToast();

  useEffect(() => {
    let animationFrameId: number;
    const frameInterval = 1000 / 30; // Target 30 FPS
    let lastFrameTime = 0;

    const processFrame = (timestamp: number) => {
      if (!isActive || !cameraInitialized || processingRef.current) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      // Control frame rate
      if (timestamp - lastFrameTime < frameInterval) {
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas?.getContext('2d');

      if (!video || !canvas || !context) {
        console.error('Video or canvas elements not ready:', { video, canvas, context });
        animationFrameId = requestAnimationFrame(processFrame);
        return;
      }

      // Solo procesar cuando el video está realmente listo
      if (video.readyState === video.HAVE_ENOUGH_DATA && 
          video.videoWidth > 0 && 
          video.videoHeight > 0) {
        
        processingRef.current = true;

        try {
          // Update canvas dimensions if needed
          if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            console.log('Canvas dimensions updated:', {
              width: canvas.width,
              height: canvas.height
            });
          }

          context.drawImage(video, 0, 0);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          frameCountRef.current++;
          if (frameCountRef.current % 2 === 0) { // Process every other frame
            onFrame(imageData);
          }

          lastFrameTime = timestamp;
        } catch (error) {
          console.error('Error processing frame:', error);
          toast({
            variant: "destructive",
            title: "Error",
            description: "Error al procesar imagen de la cámara"
          });
        } finally {
          processingRef.current = false;
        }
      } else {
        console.log('Video not fully ready:', {
          readyState: video.readyState,
          width: video.videoWidth,
          height: video.videoHeight
        });
      }

      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (isActive && cameraInitialized) {
      console.log('Starting frame processing');
      animationFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, onFrame, cameraInitialized, videoRef, toast]);

  return <canvas ref={canvasRef} className="hidden" />;
};

export default CameraProcessor;
