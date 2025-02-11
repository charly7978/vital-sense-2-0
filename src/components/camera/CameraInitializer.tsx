
import React, { useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

  useEffect(() => {
    let currentStream: MediaStream | null = null;

    const initCamera = async () => {
      try {
        if (!isActive) return;

        // Stop any existing streams first
        if (currentStream) {
          currentStream.getTracks().forEach(track => track.stop());
        }

        // Request camera access with basic settings
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        // Validate stream
        if (!stream.getVideoTracks().length) {
          throw new Error('No se encontró un track de video válido');
        }

        currentStream = stream;
        console.log('Cámara inicializada:', stream.getVideoTracks()[0].getSettings());
        onError(null);
        onInitialized(stream);

        toast({
          title: "Cámara iniciada",
          description: "La cámara se ha iniciado correctamente"
        });

      } catch (error) {
        console.error('Error al inicializar la cámara:', error);
        onError('Error al iniciar la cámara. Por favor, verifica los permisos.');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo iniciar la cámara. Verifica los permisos."
        });
      }
    };

    // Initialize camera when component becomes active
    if (isActive) {
      initCamera();
    }

    // Cleanup function
    return () => {
      if (currentStream) {
        console.log('Limpiando streams de cámara');
        currentStream.getTracks().forEach(track => {
          track.stop();
          console.log('Track detenido:', track.label);
        });
        currentStream = null;
      }
    };
  }, [isActive, onInitialized, onError, toast]);

  return null;
};

export default CameraInitializer;
