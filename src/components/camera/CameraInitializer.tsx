
import React, { useEffect, useState, useCallback } from 'react';
import { Camera as CapCamera } from '@capacitor/camera';

interface CameraInitializerProps {
  onInitialized: (stream: MediaStream) => void;
  isActive: boolean;
  onError: (error: string) => void;
}

const CameraInitializer: React.FC<CameraInitializerProps> = ({
  onInitialized,
  isActive,
  onError,
}) => {
  const [isAndroid, setIsAndroid] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsAndroid(userAgent.includes('android'));
  }, []);

  const stopCurrentStream = useCallback(() => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => {
        track.stop();
        currentStream.removeTrack(track);
      });
      setCurrentStream(null);
    }
  }, [currentStream]);

  const initializeCamera = useCallback(async () => {
    try {
      // Stop any existing stream before starting a new one
      stopCurrentStream();

      const permission = await CapCamera.checkPermissions();
      if (permission.camera !== 'granted') {
        const request = await CapCamera.requestPermissions();
        if (request.camera !== 'granted') {
          throw new Error('Permiso de cámara denegado');
        }
      }

      if (!isActive) return;

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isAndroid ? 'environment' : 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      console.log('Requesting camera stream with constraints:', constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!isActive) {
        // If component was deactivated while awaiting stream, cleanup
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      setCurrentStream(stream);
      console.log('Camera stream obtained successfully');

      if (isAndroid) {
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack.getCapabilities?.()?.torch) {
          try {
            await videoTrack.applyConstraints({
              advanced: [{ torch: true } as any]
            });
            console.log('Torch activated successfully');
          } catch (e) {
            console.error('Error activating torch:', e);
          }
        }
      }

      onInitialized(stream);
    } catch (error) {
      console.error('Error initializing camera:', error);
      onError('Error al iniciar la cámara. Por favor, verifica los permisos y reintenta.');
      stopCurrentStream();
    }
  }, [isActive, isAndroid, onInitialized, onError, stopCurrentStream]);

  useEffect(() => {
    let initTimeout: NodeJS.Timeout;

    if (isActive) {
      // Add a small delay before initialization to ensure proper cleanup
      initTimeout = setTimeout(() => {
        initializeCamera();
      }, 100);
    } else {
      stopCurrentStream();
    }

    return () => {
      clearTimeout(initTimeout);
      stopCurrentStream();
    };
  }, [isActive, initializeCamera, stopCurrentStream]);

  return null;
};

export default CameraInitializer;
