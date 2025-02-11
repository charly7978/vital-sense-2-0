
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { 
            facingMode: 'user',
            width: { ideal: 640 },
            height: { ideal: 480 }
          } 
        });
        stream.getTracks().forEach(track => track.stop());
        setError(null);
      } catch (err) {
        console.error('Error accessing camera:', err);
        setError('No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara en la configuración de tu navegador.');
      }
    };

    checkPermissions();
  }, []);

  useEffect(() => {
    let animationFrameId: number;

    const processFrame = () => {
      if (webcamRef.current && canvasRef.current) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (video && context && video.readyState === video.HAVE_ENOUGH_DATA) {
          const videoWidth = video.videoWidth;
          const videoHeight = video.videoHeight;
          
          if (videoWidth && videoHeight) {
            canvas.width = videoWidth;
            canvas.height = videoHeight;
            context.drawImage(video, 0, 0);
            
            try {
              const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
              onFrame(imageData);
            } catch (error) {
              console.error('Error processing frame:', error);
            }
          }
        }
      }
      if (isInitialized) {
        animationFrameId = requestAnimationFrame(processFrame);
      }
    };

    if (isInitialized) {
      processFrame();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (webcamRef.current?.stream) {
        webcamRef.current.stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [isInitialized, onFrame]);

  const handleUserMedia = () => {
    setIsInitialized(true);
    setError(null);
  };

  const handleUserMediaError = (err: string | DOMException) => {
    console.error('Error accessing webcam:', err);
    setError('Error al acceder a la cámara. Por favor, verifica los permisos.');
    setIsInitialized(false);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/5 backdrop-blur-sm">
        {!isInitialized && !error && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
        )}
        <Webcam
          ref={webcamRef}
          onUserMedia={handleUserMedia}
          onUserMediaError={handleUserMediaError}
          className="w-full h-full object-cover"
          videoConstraints={{
            facingMode: 'user',
            width: 640,
            height: 480,
          }}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      {isInitialized && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20">
            <p className="text-sm text-white">Coloca tu dedo sobre el lente de la cámara asegurándote de cubrir el flash</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraView;
