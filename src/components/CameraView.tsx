import React, { useRef, useEffect, useState } from 'react';
import Webcam from 'react-webcam';

const CameraView: React.FC<{ onFrame: (imageData: ImageData) => void, isActive: boolean }> = ({ onFrame, isActive }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    setIsAndroid(/android/i.test(navigator.userAgent));
  }, []);

  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) return;
    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      requestAnimationFrame(processFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0);
    onFrame(context.getImageData(0, 0, canvas.width, canvas.height));

    requestAnimationFrame(processFrame);
  };

  return (
    <div className="relative w-full max-w-md mx-auto">
      <Webcam ref={webcamRef} className="w-full h-full object-cover"
        videoConstraints={{ facingMode: isAndroid ? 'environment' : 'user' }} />
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default CameraView;
