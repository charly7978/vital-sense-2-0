
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { MediaTrackConstraintsExtended } from "@/types";

interface UseCameraInitializerProps {
  videoConstraints: MediaTrackConstraintsExtended;
  setIsInitializing: (value: boolean) => void;
  setHasError: (value: boolean) => void;
}

export const useCameraInitializer = ({
  videoConstraints,
  setIsInitializing,
  setHasError,
}: UseCameraInitializerProps) => {
  const { toast } = useToast();

  const initializeCamera = useCallback(async () => {
    try {
      console.log('Intentando iniciar cámara con config básica');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
          facingMode: "environment"
        },
        audio: false
      });

      if (!stream) {
        console.error('No se pudo obtener el stream de la cámara');
        throw new Error('No stream available');
      }

      const track = stream.getVideoTracks()[0];
      console.log('Cámara iniciada exitosamente:', {
        label: track.label,
        settings: track.getSettings()
      });

      return true;

    } catch (error) {
      console.error('Error al iniciar la cámara:', error);
      setHasError(true);
      
      toast({
        title: "Error de cámara",
        description: "No se pudo acceder a la cámara. Por favor, verifique los permisos.",
        variant: "destructive",
        className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
      });

      return false;
    }
  }, [videoConstraints, setHasError, toast]);

  return { initializeCamera };
};
