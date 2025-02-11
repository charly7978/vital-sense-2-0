
import React, { useRef, useEffect } from 'react';

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

      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (video && context && video.readyState === video.HAVE_ENOUGH_DATA) {
          processingRef.current = true;

          try {
            // Update canvas dimensions if needed
            if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
              canvas.width = video.videoWidth;
              canvas.height = video.videoHeight;
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
          } finally {
            processingRef.current = false;
          }
        }
      }

      animationFrameId = requestAnimationFrame(processFrame);
    };

    if (isActive && cameraInitialized) {
      animationFrameId = requestAnimationFrame(processFrame);
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, onFrame, cameraInitialized, videoRef]);

  return <canvas ref={canvasRef} className="hidden" />;
};

export default CameraProcessor;
