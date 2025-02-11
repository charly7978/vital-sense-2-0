
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

  const initializeCamera = useCallback(async () => {
    try {
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
          height: { ideal: 480 },
          ...(isAndroid && {
            advanced: [{
              torch: true
            } as any]
          })
        }
      };

      // Stop any existing stream before creating a new one
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setCurrentStream(stream);
      
      if (isAndroid) {
        const videoTrack = stream.getVideoTracks()[0];
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: true } as any]
          });
          console.log('Linterna activada exitosamente');
        } catch (e) {
          console.error('Error al activar la linterna:', e);
        }
      }

      onInitialized(stream);
    } catch (error) {
      console.error('Error initializing camera:', error);
      onError('Error al iniciar la cámara. Por favor, verifica los permisos.');
    }
  }, [isActive, isAndroid, onInitialized, onError, currentStream]);

  useEffect(() => {
    if (isActive) {
      initializeCamera();
    } else if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
    }

    return () => {
      if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        setCurrentStream(null);
      }
    };
  }, [isActive, initializeCamera, currentStream]);

  return null;
};

export default CameraInitializer;
