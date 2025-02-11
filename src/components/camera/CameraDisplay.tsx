
import React, { useEffect } from 'react';
import { Camera } from 'lucide-react';
import Webcam from 'react-webcam';
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CameraDisplayProps {
  error: string | null;
  isActive: boolean;
  cameraInitialized: boolean;
  webcamRef: React.RefObject<Webcam>;
  isAndroid: boolean;
}

// Extended interface for the track with torch capability
interface TrackWithTorch extends MediaStreamTrack {
  applyConstraints(constraints: MediaTrackConstraints & { advanced?: { torch?: boolean }[] }): Promise<void>;
}

const CameraDisplay: React.FC<CameraDisplayProps> = ({
  error,
  isActive,
  cameraInitialized,
  webcamRef,
  isAndroid,
}) => {
  useEffect(() => {
    const enableFlashlight = async () => {
      if (isAndroid && isActive && webcamRef.current?.video) {
        try {
          const stream = webcamRef.current.video.srcObject as MediaStream;
          const track = stream.getVideoTracks()[0] as TrackWithTorch;
          
          if (track) {
            await track.applyConstraints({
              advanced: [{ torch: true }]
            });
            console.log('Flashlight enabled successfully');
          }
        } catch (error) {
          console.error('Error enabling flashlight:', error);
        }
      }
    };

    enableFlashlight();

    return () => {
      if (isAndroid && webcamRef.current?.video) {
        const stream = webcamRef.current.video.srcObject as MediaStream;
        const track = stream?.getVideoTracks()[0] as TrackWithTorch;
        if (track) {
          track.applyConstraints({
            advanced: [{ torch: false }]
          }).catch(console.error);
        }
      }
    };
  }, [isActive, isAndroid, webcamRef]);

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
        {isActive && (
          <Webcam
            ref={webcamRef}
            className="w-full h-full object-cover"
            videoConstraints={{
              width: { ideal: 640 },
              height: { ideal: 480 },
              facingMode: isAndroid ? 'environment' : 'user'
            }}
          />
        )}
      </div>
      
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

export default CameraDisplay;
