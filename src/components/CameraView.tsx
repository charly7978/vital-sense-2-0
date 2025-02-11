
import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';
import { Camera } from 'lucide-react';

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const processFrame = () => {
      if (webcamRef.current && canvasRef.current) {
        const video = webcamRef.current.video;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        if (video && context) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          onFrame(imageData);
        }
      }
      requestAnimationFrame(processFrame);
    };

    if (isInitialized) {
      processFrame();
    }
  }, [isInitialized, onFrame]);

  return (
    <div className="relative w-full max-w-md mx-auto">
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-black/5 backdrop-blur-sm">
        {!isInitialized && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Camera className="w-8 h-8 text-gray-400 animate-pulse" />
          </div>
        )}
        <Webcam
          ref={webcamRef}
          onUserMedia={() => setIsInitialized(true)}
          className="w-full h-full object-cover"
          videoConstraints={{
            facingMode: 'user',
            width: 640,
            height: 480,
          }}
        />
        <canvas ref={canvasRef} className="hidden" />
      </div>
      <div className="absolute bottom-4 left-4 right-4">
        <div className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-lg border border-white/20">
          <p className="text-sm text-white">Place your finger over the camera lens</p>
        </div>
      </div>
    </div>
  );
};

export default CameraView;
