
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import CameraInitializer from './camera/CameraInitializer';
import CameraProcessor from './camera/CameraProcessor';
import CameraDisplay from './camera/CameraDisplay';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
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

  const stopCamera = async () => {
    if (!streamRef.current) return;

    try {
      const tracks = streamRef.current.getTracks();
      tracks.forEach(track => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      streamRef.current = null;
      
      if (webcamRef.current?.stream) {
        webcamRef.current.stream.getTracks().forEach(track => track.stop());
      }
      
      setCameraInitialized(false);
      console.log('Camera stopped successfully');
    } catch (error) {
      console.error('Error stopping camera:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al detener la cámara"
      });
    }
  };

  const handleCameraInitialized = (stream: MediaStream) => {
    if (streamRef.current) {
      stopCamera();
    }

    streamRef.current = stream;
    if (webcamRef.current && webcamRef.current.video) {
      webcamRef.current.video.srcObject = stream;
      // Ensure video is playing
      webcamRef.current.video.play().catch(console.error);
    }
    setCameraInitialized(true);
    console.log('Camera started successfully');
    setError(null);
    
    toast({
      title: "Cámara iniciada",
      description: "La cámara se ha iniciado correctamente"
    });
  };

  useEffect(() => {
    if (!isActive) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
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
