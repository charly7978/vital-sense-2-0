
import React, { useEffect, useState } from 'react';
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

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsAndroid(userAgent.includes('android'));
  }, []);

  useEffect(() => {
    const initializeCamera = async () => {
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

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
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
    };

    if (isActive) {
      initializeCamera();
    }
  }, [isActive, isAndroid, onInitialized, onError]);

  return null;
};

export default CameraInitializer;
