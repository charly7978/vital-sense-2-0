
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { loadOpenCV, isOpenCVLoaded } from '@/utils/opencvLoader';
import CameraInitializer from './camera/CameraInitializer';
import CameraProcessor from './camera/CameraProcessor';
import CameraDisplay from './camera/CameraDisplay';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

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
  const [loadingOpenCV, setLoadingOpenCV] = useState(true);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsAndroid(userAgent.includes('android'));
  }, []);

  useEffect(() => {
    const initOpenCV = async () => {
      setLoadingOpenCV(true);
      try {
        await loadOpenCV();
        console.log('OpenCV initialized successfully');
        setLoadingOpenCV(false);
        setError(null);
      } catch (err) {
        console.error('Error initializing OpenCV:', err);
        setError('Error al cargar OpenCV. Por favor, recarga la página y asegúrate de tener una conexión estable a internet.');
        setLoadingOpenCV(false);
      }
    };

    if (!isOpenCVLoaded()) {
      initOpenCV();
    } else {
      setLoadingOpenCV(false);
    }
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
    }
  };

  const handleCameraInitialized = (stream: MediaStream) => {
    if (streamRef.current) {
      stopCamera();
    }

    streamRef.current = stream;
    if (webcamRef.current && webcamRef.current.video) {
      webcamRef.current.video.srcObject = stream;
    }
    setCameraInitialized(true);
    console.log('Camera started successfully');
    setError(null);
  };

  useEffect(() => {
    if (!isActive) {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive]);

  if (loadingOpenCV) {
    return (
      <div className="p-4">
        <Alert variant="default" className="bg-yellow-500/10 border-yellow-500/50">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-100">
            Cargando OpenCV, por favor espere...
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

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
        isActive={isActive && !loadingOpenCV}
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
