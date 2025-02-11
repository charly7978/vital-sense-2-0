
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { useToast } from "@/hooks/use-toast";
import { Camera } from 'lucide-react';

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAndroid, setIsAndroid] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();
  const animationFrameRef = useRef<number>();
  const processingRef = useRef(false);

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsAndroid(userAgent.includes('android'));
  }, []);

  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current || !processingRef.current) return;

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
    }

    context.drawImage(video, 0, 0);
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    onFrame(imageData);

    if (processingRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
    }
  };

  // Manejo específico del ciclo de procesamiento de frames
  useEffect(() => {
    if (!isActive) {
      processingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
      return;
    }

    processingRef.current = true;
    animationFrameRef.current = requestAnimationFrame(processFrame);

    return () => {
      processingRef.current = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = undefined;
      }
    };
  }, [isActive]);

  useEffect(() => {
    let mounted = true;

    const initializeCamera = async () => {
      try {
        if (!isActive) return;

        const constraints = {
          video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            frameRate: { ideal: 30 },
            facingMode: isAndroid ? 'environment' : 'user'
          },
          audio: false
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }

        streamRef.current = stream;
        setError(null);

        // Verificar y habilitar el flash solo si está disponible
        if (isAndroid) {
          try {
            const track = stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            if (capabilities.torch) {
              await track.applyConstraints({
                advanced: [{ torch: true }]
              });
            }
          } catch (flashError) {
            console.warn('Flash no disponible:', flashError);
          }
        }
      } catch (err) {
        console.warn('Error de cámara:', err);
        const errorMessage = err instanceof Error ? err.message : 'Error al iniciar la cámara';
        setError(errorMessage);
        toast({
          variant: "destructive",
          title: "Error de cámara",
          description: errorMessage
        });
      }
    };

    initializeCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => {
          track.stop();
        });
        streamRef.current = null;
      }
    };
  }, [isActive, isAndroid, toast]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}
      
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/5 backdrop-blur-sm">
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
        {isActive && (
          <Webcam
            ref={webcamRef}
            className="w-full h-full object-cover"
            videoConstraints={{
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: isAndroid ? 'environment' : 'user',
              frameRate: { ideal: 30 }
            }}
          />
        )}
      </div>
      
      <canvas ref={canvasRef} className="hidden" />
      
      <div className="absolute bottom-4 left-4 right-4">
        <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20">
          <p className="text-sm text-white">
            {isAndroid 
              ? "Coloca tu dedo sobre el lente de la cámara asegurándote de cubrir el flash"
              : "Coloca tu dedo sobre la cámara"
            }
          </p>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
