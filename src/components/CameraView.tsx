
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

  useEffect(() => {
    if (webcamRef.current?.video) {
      videoRef.current = webcamRef.current.video;
    }
  }, [webcamRef.current]);

  const handleCameraInitialized = (stream: MediaStream) => {
    // Detener cualquier stream existente
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
    }

    streamRef.current = stream;
    if (webcamRef.current?.video) {
      webcamRef.current.video.srcObject = stream;
      webcamRef.current.video.play().catch(console.error);
    }
    setCameraInitialized(true);
    setError(null);
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!isActive && streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
      setCameraInitialized(false);
    }
  }, [isActive]);

  return (
    <>
      <CameraInitializer
        onInitialized={handleCameraInitialized}
        isActive={isActive}
        onError={setError}
      />
      <CameraProcessor
        videoRef={videoRef}
        onFrame={onFrame}
        isActive={isActive}
        cameraInitialized={cameraInitialized}
      />
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
