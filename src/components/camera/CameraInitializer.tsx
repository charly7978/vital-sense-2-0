
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

        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          }
        };

        console.log('Intentando inicializar cámara con constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!stream) {
          throw new Error('No se pudo obtener stream de la cámara');
        }

        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) {
          throw new Error('No se encontró track de video');
        }

        console.log('Cámara inicializada exitosamente:', videoTrack.getSettings());
        currentStream = stream;
        onInitialized(stream);
        onError(null);

        toast({
          title: "Cámara iniciada",
          description: "La cámara se ha iniciado correctamente"
        });

      } catch (error) {
        console.error('Error al inicializar la cámara:', error);
        onError('Error al iniciar la cámara. Por favor, verifica los permisos.');
        toast({
          variant: "destructive",
          title: "Error de cámara",
          description: error.message || "No se pudo iniciar la cámara"
        });
      }
    };

    if (isActive) {
      console.log('Iniciando cámara...');
      initCamera();
    }

    return () => {
      if (currentStream) {
        console.log('Deteniendo streams de cámara');
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
