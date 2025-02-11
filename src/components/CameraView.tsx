
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera as CapCamera } from '@capacitor/camera';
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
  const [isPlatformAndroid, setIsPlatformAndroid] = useState(false);

  useEffect(() => {
    // Detectar si estamos en Android
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsPlatformAndroid(userAgent.includes('android'));
  }, []);

  useEffect(() => {
    const checkPermissions = async () => {
      try {
        // Primero intentamos con Capacitor
        const permission = await CapCamera.checkPermissions();
        console.log('Camera permission status:', permission.camera);
        
        if (permission.camera !== 'granted') {
          console.log('Requesting camera permission...');
          const request = await CapCamera.requestPermissions();
          console.log('Camera permission request result:', request.camera);
          
          if (request.camera !== 'granted') {
            throw new Error('Permiso de cámara denegado');
          }
        }

        // Si estamos en Android, intentamos habilitar el flash
        if (isPlatformAndroid) {
          try {
            // Intenta encender el flash usando la API del navegador
            const stream = await navigator.mediaDevices.getUserMedia({
              video: {
                facingMode: 'environment',
                width: { ideal: 640 },
                height: { ideal: 480 },
                //@ts-ignore - La propiedad torch existe en Android
                advanced: [{ torch: true }]
              }
            });
            console.log('Flash enabled on Android');
          } catch (flashError) {
            console.error('Error enabling flash:', flashError);
          }
        }
        
        setError(null);
      } catch (capError) {
        console.log('Capacitor camera error, trying web API:', capError);
        // Si falla Capacitor, intentamos con la API web
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
        } catch (webError) {
          console.error('Web camera error:', webError);
          setError('No se pudo acceder a la cámara. Por favor, permite el acceso a la cámara en la configuración de tu dispositivo.');
        }
      }
    };

    checkPermissions();
  }, [isPlatformAndroid]);

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
    console.log('Camera initialized successfully');
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
            facingMode: isPlatformAndroid ? 'environment' : 'user',
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
