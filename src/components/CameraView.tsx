
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { loadOpenCV } from '@/utils/opencvLoader';
import CameraInitializer from './camera/CameraInitializer';
import CameraProcessor from './camera/CameraProcessor';
import CameraDisplay from './camera/CameraDisplay';

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

  useEffect(() => {
    const initOpenCV = async () => {
      try {
        await loadOpenCV();
        console.log('OpenCV initialized successfully');
      } catch (err) {
        console.error('Error initializing OpenCV:', err);
        setError('Error al cargar OpenCV. Por favor, recarga la página.');
      }
    };

    initOpenCV();
  }, []);

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
    try {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
        streamRef.current = null;
      }
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
    streamRef.current = stream;
    if (webcamRef.current && webcamRef.current.video) {
      webcamRef.current.video.srcObject = stream;
    }
    setCameraInitialized(true);
    console.log('Camera started successfully');
    setError(null);
  };

  useEffect(() => {
    if (!isActive && cameraInitialized) {
      stopCamera();
    }

    return () => {
      if (cameraInitialized) {
        stopCamera();
      }
    };
  }, [isActive, cameraInitialized]);

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

