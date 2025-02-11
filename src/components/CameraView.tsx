
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera as CapCamera } from '@capacitor/camera';
import { Camera } from 'lucide-react';
import { Alert, AlertDescription } from "@/components/ui/alert";

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

  useEffect(() => {
    const userAgent = window.navigator.userAgent.toLowerCase();
    setIsAndroid(userAgent.includes('android'));
  }, []);

  const stopCamera = async () => {
    try {
      if (streamRef.current) {
        const tracks = streamRef.current.getTracks();
        tracks.forEach(track => track.stop());
        streamRef.current = null;
      }
      if (webcamRef.current?.stream) {
        webcamRef.current.stream.getTracks().forEach(track => track.stop());
      }
      console.log('Camera stopped successfully');
    } catch (error) {
      console.error('Error stopping camera:', error);
    }
  };

  const startCamera = async () => {
    try {
      const permission = await CapCamera.checkPermissions();
      if (permission.camera !== 'granted') {
        const request = await CapCamera.requestPermissions();
        if (request.camera !== 'granted') {
          throw new Error('Permiso de cámara denegado');
        }
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: isAndroid ? 'environment' : 'user',
          width: { ideal: 640 },
          height: { ideal: 480 },
          ...(isAndroid && {
            advanced: [{
              // En Android, intentamos habilitar la linterna
              torch: true
            } as any] // Usamos 'any' aquí porque el tipo MediaTrackConstraints no incluye 'torch'
          })
        }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      
      if (isAndroid) {
        const videoTrack = stream.getVideoTracks()[0];
        // Intentamos habilitar la linterna después de obtener el stream
        try {
          await videoTrack.applyConstraints({
            advanced: [{ torch: true } as any]
          });
          console.log('Linterna activada exitosamente');
        } catch (e) {
          console.error('Error al activar la linterna:', e);
        }
      }
      
      if (webcamRef.current && webcamRef.current.video) {
        webcamRef.current.video.srcObject = stream;
      }
      
      console.log('Camera started successfully');
      setError(null);
    } catch (error) {
      console.error('Error starting camera:', error);
      setError('Error al iniciar la cámara. Por favor, verifica los permisos.');
    }
  };

  useEffect(() => {
    if (isActive) {
      startCamera();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [isActive, isAndroid]);

  useEffect(() => {
    let animationFrameId: number;

    const processFrame = () => {
      if (!isActive) return;

      if (webcamRef.current && canvasRef.current) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (video && context && video.readyState === video.HAVE_ENOUGH_DATA) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);

          try {
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            onFrame(imageData);
          } catch (error) {
            console.error('Error processing frame:', error);
          }
        }
      }

      if (isActive) {
        animationFrameId = requestAnimationFrame(processFrame);
      }
    };

    if (isActive) {
      processFrame();
    }

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isActive, onFrame]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/5 backdrop-blur-sm">
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400" />
          </div>
        )}
        <Webcam
          ref={webcamRef}
          className="w-full h-full object-cover"
          videoConstraints={{
            facingMode: isAndroid ? 'environment' : 'user',
            width: 640,
            height: 480
          }}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      
      {isActive && (
        <div className="absolute bottom-4 left-4 right-4">
          <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20">
            <p className="text-sm text-white">
              {isAndroid 
                ? "Coloca tu dedo sobre el lente de la cámara asegurándote de cubrir el flash"
                : "Coloca tu dedo sobre la cámara frontal"
              }
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default CameraView;
