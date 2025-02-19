import React, { useRef, useEffect } from 'react';
import { MediaTrackConstraintsExtended } from '@/types/vitals';

interface CameraViewProps {
  onFrame: (frame: ImageData) => void;
  enabled: boolean;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, enabled }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const constraints: MediaStreamConstraints = {
    video: {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "user",
      frameRate: 30
    } as MediaTrackConstraintsExtended
  };

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function startCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
          };
        }
      } catch (error) {
        console.error("Error accessing camera:", error);
      }
    }

    function stopCamera() {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      }
    }

    async function captureFrame() {
      if (videoRef.current && canvasRef.current && enabled) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        context?.drawImage(video, 0, 0, canvas.width, canvas.height);
        const frame = context?.getImageData(0, 0, canvas.width, canvas.height);

        if (frame) {
          onFrame(frame);
        }
        requestAnimationFrame(captureFrame);
      }
    }

    if (enabled) {
      startCamera();
      captureFrame();
    } else {
      stopCamera();
    }

    return () => {
      stopCamera();
    };
  }, [onFrame, enabled]);

  return (
    <>
      <video ref={videoRef} style={{ display: 'none' }} />
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
};

export default CameraView;
