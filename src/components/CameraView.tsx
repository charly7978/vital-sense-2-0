import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
  onMeasurementEnd?: () => void; // 🔹 Se asegura que onMeasurementEnd es opcional
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

    // 🔹 Validar si el video está disponible antes de procesar
    if (!context || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      console.warn("⚠️ Video no está listo, esperando...");
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    // 🔹 Ajustar el tamaño del canvas al video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameData = context.getImageData(0, 0, canvas.width, canvas.height);

      // 🔹 Validar si la imagen es válida antes de procesar
      if (!frameData || frameData.data.length < 4) {
        console.warn("⚠️ Frame inválido detectado, omitiendo...");
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const signal = calculateSignalStrength(frameData);
      setSignalStrength(signal);

      if (signal < 10) {
        setBpm(0);
        setSpo2(0);
        setQuality(0);
        if (onMeasurementEnd) onMeasurementEnd(); // 🔹 Verifica que la función exista antes de llamarla
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

  const playBeep = () => {
    beepAudio.current.currentTime = 0;
    beepAudio.current.volume = 1.0;
    beepAudio.current.play();
  };

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
