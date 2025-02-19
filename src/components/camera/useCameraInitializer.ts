
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
        video: videoConstraints as MediaTrackConstraints,
        audio: false
      });

      if (!stream) {
        throw new Error('No stream available');
      }

      const track = stream.getVideoTracks()[0];
      console.log('Camera initialized:', {
        label: track.label,
        settings: track.getSettings()
      });

      return true;

    } catch (error) {
      console.error('Camera initialization error:', error);
      setHasError(true);
      
      toast({
        title: "Camera Error",
        description: "Could not access camera. Please check permissions.",
        variant: "destructive",
      });

      return false;
    }
  }, [videoConstraints, setHasError, toast]);

  return { initializeCamera };
};
