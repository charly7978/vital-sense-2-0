
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
        video: videoConstraints,
        audio: false
      });

      const track = stream.getVideoTracks()[0];
      
      console.log('Capacidades de la cámara:', track.getCapabilities());

      const settings: MediaTrackConstraintsExtended = {
        whiteBalance: { ideal: "continuous" },
        exposureMode: { ideal: "continuous" },
        exposureCompensation: { ideal: 0.5 },
      };

      try {
        await track.applyConstraints(settings);
      } catch (e) {
        console.warn('Algunas configuraciones no están soportadas:', e);
      }

      return true;

    } catch (error) {
      console.error('Error inicializando cámara:', error);
      setHasError(true);
      setIsInitializing(false);
      
      toast({
        title: "Error de cámara",
        description: "Verifique los permisos de la cámara",
        variant: "destructive",
        className: "bg-black/40 backdrop-blur-sm text-sm text-white/80"
      });

      return false;
    }
  }, [videoConstraints, setIsInitializing, setHasError, toast]);

  return { initializeCamera };
};
