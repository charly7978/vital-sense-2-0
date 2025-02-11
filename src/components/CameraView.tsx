
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import CameraInitializer from './camera/CameraInitializer';
import CameraProcessor from './camera/CameraProcessor';
import CameraDisplay from './camera/CameraDisplay';
import { useToast } from "@/hooks/use-toast";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);
  const [cameraInitialized, setCameraInitialized] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsAndroid(userAgent.includes('android'));
  }, []);

  const handleCameraInitialized = (stream: MediaStream) => {
    console.log('Camera initialized, setting up video stream');
    streamRef.current = stream;
    
    if (webcamRef.current?.video) {
      webcamRef.current.video.srcObject = stream;
      webcamRef.current.video.play().catch(error => {
        console.error('Error playing video:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo reproducir el video de la cámara"
        });
      });
    }
    
    setCameraInitialized(true);
    setError(null);
  };

  const cleanup = () => {
    console.log('Cleaning up camera resources');
    if (streamRef.current) {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
        console.log(`Stopped track: ${track.kind}`);
      });
      streamRef.current = null;
    }
    setCameraInitialized(false);
  };

  useEffect(() => {
    if (!isActive) {
      cleanup();
    }
    return cleanup;
  }, [isActive]);

  useEffect(() => {
    if (webcamRef.current?.video) {
      videoRef.current = webcamRef.current.video;
    }
  }, [webcamRef.current]);

  return (
    <>
      <CameraInitializer
        onInitialized={handleCameraInitialized}
        isActive={isActive}
        onError={setError}
      />
      {cameraInitialized && (
        <CameraProcessor
          videoRef={videoRef}
          onFrame={onFrame}
          isActive={isActive && cameraInitialized}
          cameraInitialized={cameraInitialized}
        />
      )}
      <CameraDisplay
        error={error}
        isActive={isActive}
        cameraInitialized={cameraInitialized}
        webcamRef={webcamRef}
        isAndroid={isAndroid}
      />
    </>
  );
};

export default CameraView;
