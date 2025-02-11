
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

  useEffect(() => {
    let animationFrameId: number;

    const processFrame = () => {
      if (!isActive || !cameraInitialized || processingRef.current) {
        return;
      }

      if (videoRef.current && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (video && context && video.readyState === video.HAVE_ENOUGH_DATA) {
          processingRef.current = true;

          try {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            onFrame(imageData);
          } catch (error) {
            console.error('Error processing frame:', error);
          } finally {
            processingRef.current = false;
          }
        }
      }

      if (isActive && cameraInitialized) {
        animationFrameId = requestAnimationFrame(processFrame);
      }
    };

    if (isActive && cameraInitialized) {
      processFrame();
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
