import React, { useRef, useEffect, useState } from "react";
import Webcam from "react-webcam";
import { useToast } from "@/hooks/use-toast";
import { Camera } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

interface CameraViewProps {
  onFrame: (imageData: ImageData) => void;
  isActive: boolean;
  onMeasurementEnd?: () => void;
}

const CameraView: React.FC<CameraViewProps> = ({ onFrame, isActive, onMeasurementEnd }) => {
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const { toast } = useToast();
  const [bpm, setBpm] = useState(0);
  const [spo2, setSpo2] = useState(98);
  const [quality, setQuality] = useState(0);
  const isMobile = useIsMobile();
  const beepAudio = useRef(new Audio("/beep.mp3"));

  useEffect(() => {
    beepAudio.current.volume = 1.0;
  }, []);

  const processFrame = () => {
    if (!isActive || !webcamRef.current?.video || !canvasRef.current) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    const video = webcamRef.current.video;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context || !video || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(processFrame);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    try {
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      const frameData = context.getImageData(0, 0, canvas.width, canvas.height);

      if (!frameData || frameData.data.length < 4) {
        animationFrameRef.current = requestAnimationFrame(processFrame);
        return;
      }

      const { bpm, spo2, quality, isValid } = analyzeVitalSigns(frameData);
      if (isValid) {
        setBpm(bpm);
        setSpo2(spo2);
        setQuality(quality);
        onFrame(frameData);
      }
    } catch (error) {
      console.error("❌ Error al procesar el frame:", error);
    }

    animationFrameRef.current = requestAnimationFrame(processFrame);
  };

  useEffect(() => {
    if (isActive) {
      processFrame();
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  }, [isActive]);

  return (
    <div className="relative w-full h-screen">
      {/* 🔹 Cámara a pantalla completa */}
      {isActive && (
        <Webcam
          ref={webcamRef}
          audio={false}
          videoConstraints={{ width: 1280, height: 720, facingMode: "environment" }}
          className="absolute w-full h-full object-cover"
        />
      )}
      <canvas ref={canvasRef} style={{ display: "none" }} />

      {/* 🔹 Contenedor de datos sobre la cámara */}
      <div className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-center bg-black/20 backdrop-blur-md text-white p-4">
        {/* 🔹 BPM */}
        <div className="text-4xl font-bold">BPM: {bpm}</div>

        {/* 🔹 SpO2 */}
        <div className="text-2xl mt-2">SpO2: {spo2}%</div>

        {/* 🔹 Calidad de la señal */}
        <div className="text-lg mt-2">Señal: {quality}%</div>

        {/* 🔹 Gráfico de señal PPG */}
        <div className="absolute bottom-5 left-1/2 transform -translate-x-1/2 bg-white/20 p-3 rounded-xl">
          📊 Gráfico PPG (Placeholder)
        </div>
      </div>
    </div>
  );
};

export default CameraView;
