
import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import CameraPreview from "./camera/CameraPreview";
import CameraOverlay from "./camera/CameraOverlay";
import CameraStatus from "./camera/CameraStatus";
import { useCameraProcessor } from "./camera/useCameraProcessor";
import { useCameraInitializer } from "./camera/useCameraInitializer";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ 
  onFrame, 
  isActive
}) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [frameCount, setFrameCount] = useState(0);

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    frameRate: { ideal: 30 },
    facingMode: "environment"
  };

  const { initializeCamera } = useCameraInitializer({
    videoConstraints,
    setIsInitializing,
    setHasError
  });

  const { processFrame, animationFrameRef } = useCameraProcessor({
    isActive,
    onFrame,
    setFrameCount
  });

  useEffect(() => {
    let isMounted = true;

    const setupCamera = async () => {
      if (isActive) {
        console.log('Iniciando cámara...');
        setIsInitializing(true);
        const success = await initializeCamera();
        
        if (isMounted) {
          setIsInitializing(false);
          if (success) {
            console.log('Cámara iniciada exitosamente');
          }
        }
      }
    };

    setupCamera();

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, initializeCamera]);

  useEffect(() => {
    if (isActive && !isInitializing && !hasError && webcamRef.current?.video?.readyState === 4) {
      console.log('Iniciando procesamiento de frames...');
      processFrame(webcamRef, canvasRef);
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isActive, isInitializing, hasError, processFrame]);

  return (
    <div className="relative w-full h-screen bg-black">
      <div className="absolute inset-0">
        {isActive && (
          <>
            <CameraPreview 
              webcamRef={webcamRef}
              videoConstraints={videoConstraints}
            />

            <canvas 
              ref={canvasRef} 
              style={{ display: "none" }}
            />

            <CameraOverlay
              frameCount={frameCount}
              isInitializing={isInitializing}
              hasError={hasError}
            />
          </>
        )}

        <CameraStatus
          isInitializing={isInitializing}
          hasError={hasError}
        />
      </div>
    </div>
  );
};

export default CameraView;
