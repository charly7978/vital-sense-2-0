
import React, { useEffect, useState, useCallback } from 'react';
import { Camera as CapCamera } from '@capacitor/camera';
import { useToast } from "@/hooks/use-toast";

interface CameraInitializerProps {
  onInitialized: (stream: MediaStream) => void;
  isActive: boolean;
  onError: (error: string) => void;
}

interface ExtendedCapabilities extends MediaTrackCapabilities {
  torch?: boolean;
}

interface ExtendedConstraints extends MediaTrackConstraintSet {
  torch?: boolean;
}

const CameraInitializer: React.FC<CameraInitializerProps> = ({
  onInitialized,
  isActive,
  onError,
}) => {
  const [isAndroid, setIsAndroid] = useState(false);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const { toast } = useToast();

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
      console.log('Camera stream stopped');
    }
  }, [currentStream]);

  const initializeCamera = useCallback(async () => {
    try {
      stopCurrentStream();

      if (!isActive) {
        console.log('Camera not active, skipping initialization');
        return;
      }

      const permission = await CapCamera.checkPermissions();
      if (permission.camera !== 'granted') {
        const request = await CapCamera.requestPermissions();
        if (request.camera !== 'granted') {
          throw new Error('Permiso de cámara denegado');
        }
      }

      console.log('Camera permissions granted, initializing stream...');

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isAndroid ? 'environment' : 'user',
          width: { ideal: 640 },
          height: { ideal: 480 }
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('Camera stream obtained successfully');
      
      if (!isActive) {
        stream.getTracks().forEach(track => track.stop());
        console.log('Camera deactivated during initialization');
        return;
      }

      setCurrentStream(stream);

      if (isAndroid) {
        const videoTrack = stream.getVideoTracks()[0];
        const capabilities = videoTrack.getCapabilities() as ExtendedCapabilities;
        
        if (capabilities?.torch) {
          try {
            const advancedConstraint: ExtendedConstraints = { torch: true };
            await videoTrack.applyConstraints({
              advanced: [advancedConstraint]
            });
            console.log('Torch enabled successfully');
          } catch (e) {
            console.error('Error activando la linterna:', e);
          }
        }
      }

      onInitialized(stream);
      toast({
        title: "Cámara iniciada",
        description: "La cámara se ha iniciado correctamente"
      });
    } catch (error) {
      console.error('Error iniciando la cámara:', error);
      onError('Error al iniciar la cámara. Por favor, verifica los permisos y reintenta.');
      stopCurrentStream();
      toast({
        variant: "destructive",
        title: "Error",
        description: "Error al iniciar la cámara. Verifica los permisos."
      });
    }
  }, [isActive, isAndroid, onInitialized, onError, stopCurrentStream, toast]);

  useEffect(() => {
    let initTimeout: NodeJS.Timeout;

    if (isActive) {
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
