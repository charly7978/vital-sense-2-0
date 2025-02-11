
import React, { useEffect, useRef } from 'react';
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
  const initializationAttemptRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    
    const initCamera = async () => {
      try {
        if (!isActive || initializationAttemptRef.current) return;
        
        initializationAttemptRef.current = true;
        console.log('Initializing camera...');

        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 }
          },
          audio: false
        };

        console.log('Requesting media with constraints:', constraints);
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        console.log('Camera stream obtained successfully');
        onInitialized(stream);
        onError(null);

      } catch (error) {
        console.error('Camera initialization error:', error);
        if (mounted) {
          onError(error.message || 'Error al iniciar la cámara');
          toast({
            variant: "destructive",
            title: "Error de cámara",
            description: error.message || "No se pudo iniciar la cámara"
          });
        }
      }
    };

    if (isActive) {
      initCamera();
    }

    return () => {
      mounted = false;
      initializationAttemptRef.current = false;
    };
  }, [isActive, onInitialized, onError, toast]);

  return null;
};

export default CameraInitializer;
