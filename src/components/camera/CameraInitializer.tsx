
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
    let timeoutId: NodeJS.Timeout;

    const initCamera = async () => {
      try {
        if (!isActive) return;

        // Primero intentar detener cualquier stream existente
        const existingStreams = await navigator.mediaDevices.getUserMedia({ video: true });
        existingStreams.getTracks().forEach(track => track.stop());

        // Esperar un momento antes de iniciar la nueva stream
        await new Promise(resolve => setTimeout(resolve, 500));

        // Solicitar acceso a la cámara con configuraciones básicas
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 }
          }
        });

        // Verificar que el stream sea válido
        const videoTrack = stream.getVideoTracks()[0];
        if (!videoTrack) {
          throw new Error('No se encontró un track de video válido');
        }

        console.log('Cámara inicializada correctamente:', videoTrack.getSettings());
        onError(null);
        onInitialized(stream);

        toast({
          title: "Cámara iniciada",
          description: "La cámara se ha iniciado correctamente"
        });

      } catch (error) {
        console.error('Error al inicializar la cámara:', error);
        onError('Error al iniciar la cámara. Por favor, verifica los permisos y reinicia la página.');
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo iniciar la cámara. Verifica los permisos y asegúrate de que no haya otras aplicaciones usando la cámara."
        });
      }
    };

    if (isActive) {
      timeoutId = setTimeout(initCamera, 1000);
    }

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isActive, onInitialized, onError, toast]);

  return null;
};

export default CameraInitializer;
