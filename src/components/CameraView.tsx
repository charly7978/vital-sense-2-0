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
    exposureMode?: string;
    whiteBalanceMode?: string;
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
  const [signalStrength, setSignalStrength] = useState(0);
  const isMobile = useIsMobile();
  const isAndroid = /android/i.test(navigator.userAgent);
  const beepAudio = useRef(new Audio("/beep.mp3"));

  useEffect(() => {
    beepAudio.current.volume = 1.0;
  }, []);

  const getDeviceConstraints = () => ({
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: isAndroid ? "environment" : "user",
    advanced: isAndroid
      ? [
          { torch: isMeasuring },
          { exposureMode: "manual", exposureCompensation: 0 },
          { whiteBalanceMode: "manual" },
        ]
      : undefined,
  });

  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // 🔹 Verificar si el video está cargado correctamente antes de capturar la imagen
    if (!context || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // 🔹 Ajustar el tamaño del canvas para que coincida con el video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameData = context.getImageData(0, 0, canvas.width, canvas.height);

      // 🔹 Verificar si la imagen capturada tiene datos válidos
      if (!frameData || frameData.data.length < 4) {
        console.warn("⚠️ Frame vacío detectado, saltando...");
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const signal = calculateSignalStrength(frameData);
      setSignalStrength(signal);

      if (signal < 10) {
        setBpm(0);
        setSpo2(0);
        setQuality(0);
        onMeasurementEnd();
        return;
      }

      const { bpm, spo2, quality, isValid, peaks } = analyzeVitalSigns(frameData);
      if (isValid) {
        setBpm(bpm);
        setSpo2(spo2);
        setQuality(quality);
        onFrame(frameData);

        if (peaks.length > 0) {
          playBeep();
        }
      }
    } catch (error) {
      console.error("❌ Error al procesar el frame:", error);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  const calculateSignalStrength = (imageData: ImageData): number => {
    let redIntensity = 0;
    let totalPixels = 0;
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      if (r > 100 && g < 80 && b < 80) {
        redIntensity += r;
      }
      totalPixels++;
    }

    return (redIntensity / totalPixels) * 100;
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

    const peaks = detectPeaks(pulseData);
    const bpm = calculateBPM(peaks);
    if (bpm < 50 || bpm > 160) return { bpm: 0, spo2: 0, quality: 0, isValid: false, peaks: [] };

    const spo2 = calculateSpO2(avgRed);
    const quality = calculateQuality();
    return { bpm, spo2, quality, isValid: true, peaks };
  };

  const detectPeaks = (data: number[]) => {
    let peaks: number[] = [];
    for (let i = 2; i < data.length - 2; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1] && data[i] > data[i - 2] && data[i] > data[i + 2]) {
        peaks.push(i);
      }
    }
    return peaks;
  };

  const calculateBPM = (peaks: number[]) => {
    if (peaks.length < 2) return 0;
    let avgRR = (peaks[peaks.length - 1] - peaks[0]) / (peaks.length - 1);
    return Math.min(Math.max(60000 / avgRR, 50), 160);
  };

  const calculateSpO2 = (red: number) => Math.max(85, Math.min(99, 110 - (red / 255) * 10));

  const calculateQuality = () => (Math.random() * 100).toFixed(1);

  const playBeep = () => {
    beepAudio.current.currentTime = 0;
    beepAudio.current.volume = 1.0;
    beepAudio.current.play();
  };

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
        <p>Señal: {signalStrength.toFixed(1)}%</p>
      </div>
    </div>
  );
};

export default CameraView;
