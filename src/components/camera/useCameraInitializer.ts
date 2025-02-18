
import { useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { MediaTrackConstraintsExtended, ExtendedMediaTrackCapabilities, ExtendedMediaTrackSettings } from "@/types";

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
          advanced: [{
            brightness: 100,         // Aumentar brillo
            contrast: 128,           // Mejorar contraste
            saturation: 128,         // Mejorar saturación
            sharpness: 128,          // Mejorar nitidez
            exposureMode: 'manual',  // Control manual de exposición
            exposureTime: 10000,     // Tiempo de exposición más largo
            exposureCompensation: 2, // Compensación de exposición positiva
            whiteBalance: 'continuous'
          }]
        },
        audio: false
      });

      const track = stream.getVideoTracks()[0];
      
      try {
        const capabilities = track.getCapabilities() as ExtendedMediaTrackCapabilities;
        const settings: ExtendedMediaTrackSettings = {};

        // Configurar controles si están disponibles
        if (capabilities.brightness) {
          settings.brightness = 100;
        }
        if (capabilities.contrast) {
          settings.contrast = 128;
        }
        if (capabilities.saturation) {
          settings.saturation = 128;
        }
        if (capabilities.exposureTime) {
          settings.exposureTime = 10000;
        }

        // Aplicar configuraciones mejoradas
        await track.applyConstraints({
          advanced: [settings as MediaTrackConstraintSet]
        });

      } catch (constraintError) {
        console.log('Usando configuración automática de cámara');
      }

      // Tiempo de estabilización
      await new Promise(resolve => setTimeout(resolve, 1000));

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
