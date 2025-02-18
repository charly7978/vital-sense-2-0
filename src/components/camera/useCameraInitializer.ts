
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...videoConstraints,
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false
      });

      const track = stream.getVideoTracks()[0];
      
      // Configuración básica de la cámara
      try {
        const capabilities = track.getCapabilities();
        const settings: MediaTrackSettings = {};

        if (capabilities.brightness) {
          settings.brightness = 100;
        }

        if (capabilities.contrast) {
          settings.contrast = 120;
        }

        if (capabilities.saturation) {
          settings.saturation = 120;
        }

        await track.applyConstraints({ advanced: [settings] });
      } catch (constraintError) {
        console.log('Usando configuración automática de cámara');
      }

      // Tiempo de estabilización
      await new Promise(resolve => setTimeout(resolve, 500));

      return true;

    } catch (error) {
      console.error('Error inicializando cámara:', error);
      setHasError(true);
      
      toast({
        title: "Error de cámara",
        description: "Verifique los permisos de la cámara",
        variant: "destructive",
        className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
      });

      return false;
    }
  }, [videoConstraints, setHasError, toast]);

  return { initializeCamera };
};
