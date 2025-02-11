
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

      // Simplified constraints for better Windows compatibility
      const constraints: MediaStreamConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      if (!stream) {
        throw new Error('No se pudo obtener el stream de la cámara');
      }

      const videoTrack = stream.getVideoTracks()[0];
      if (!videoTrack) {
        throw new Error('No se encontró un track de video');
      }

      // Log video track settings for debugging
      const settings = videoTrack.getSettings();
      console.log('Video track settings:', settings);

      if (!isActive) {
        stream.getTracks().forEach(track => track.stop());
        console.log('Camera deactivated during initialization');
        return;
      }

      // Ensure we have valid dimensions before proceeding
      if (settings.width === 0 || settings.height === 0) {
        throw new Error('Dimensiones de video inválidas');
      }

      setCurrentStream(stream);

      if (isAndroid) {
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
        description: "Error al iniciar la cámara. Verifica los permisos y asegúrate de que no haya otras aplicaciones usando la cámara."
      });
    }
  }, [isActive, isAndroid, onInitialized, onError, stopCurrentStream, toast]);

  useEffect(() => {
    let initTimeout: NodeJS.Timeout;

    if (isActive) {
      // Add a small delay before initialization
      initTimeout = setTimeout(() => {
        initializeCamera();
      }, 500); // Increased delay for better initialization
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

