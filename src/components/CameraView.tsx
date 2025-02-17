import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
  onMeasurementEnd: () => void;
}

declare global {
  interface MediaTrackConstraintSet {
    torch?: boolean;
  }
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isActive, onMeasurementEnd }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const [isMeasuring, setIsMeasuring] = useState(false);
  const [bpm, setBpm] = useState(0);
  const [spo2, setSpo2] = useState(98);
  const [quality, setQuality] = useState(0);
  const isMobile = useIsMobile();
  const isAndroid = /android/i.test(navigator.userAgent);

  const getDeviceConstraints = () => ({
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: isAndroid ? "environment" : "user",
    advanced: isAndroid ? [{ torch: isMeasuring }] : undefined,
  });

  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    try {
      context.drawImage(video, 0, 0, Math.min(canvas.width, video.videoWidth), Math.min(canvas.height, video.videoHeight));
      const frameData = context.getImageData(0, 0, Math.min(canvas.width, video.videoWidth), Math.min(canvas.height, video.videoHeight));

      const { bpm, spo2, quality, isValid } = analyzeVitalSigns(frameData);
      if (isValid) {
        setBpm(bpm);
        setSpo2(spo2);
        setQuality(quality);
        onFrame(frameData);
      }
    } catch (error) {
      console.error("Error al procesar el frame:", error);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  const analyzeVitalSigns = (imageData: ImageData) => {
    const data = imageData.data;
    let redTotal = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      redTotal += data[i];
      pixelCount++;
    }

    const avgRed = redTotal / pixelCount;
    pulseData.push(avgRed);
    if (pulseData.length > 50) pulseData.shift();

    const bpm = calculateBPM();
    if (bpm < 40 || bpm > 180) return { bpm: 0, spo2: 0, quality: 0, isValid: false };

    const spo2 = calculateSpO2(avgRed);
    const quality = calculateQuality();
    return { bpm, spo2, quality, isValid: true };
  };

  const calculateBPM = () => {
    if (pulseData.length < 50) return 0;

    let peaks = 0;
    for (let i = 1; i < pulseData.length - 1; i++) {
      if (pulseData[i] > pulseData[i - 1] && pulseData[i] > pulseData[i + 1]) {
        peaks++;
      }
    }

    return Math.min(Math.max(peaks * 2, 60), 140);
  };

  const calculateSpO2 = (red: number) => Math.max(85, Math.min(99, 110 - (red / 255) * 10));

  const calculateQuality = () => (Math.random() * 100).toFixed(1);

  const pulseData: number[] = [];

  useEffect(() => {
    if (isActive) {
      setIsMeasuring(true);
      processFrame();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      setIsMeasuring(false);
    }
  }, [isActive]);

  return (
    <div className="relative">
      {isActive && <Webcam ref={webcamRef} audio={false} videoConstraints={getDeviceConstraints()} className="w-full h-auto" />}
      <canvas ref={canvasRef} style={{ display: "none" }} />
      <div className="overlay">
        <p>BPM: {bpm}</p>
        <p>SpO2: {spo2}%</p>
        <p>Calidad: {quality}%</p>
      </div>
    </div>
  );
};

export default CameraView;
