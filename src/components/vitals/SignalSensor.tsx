import React, { useEffect, useState } from 'react';
import { Signal } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SignalSensorProps {
  redValue: number;
  signalRange: number;
  brightPixels: number;
  isActive: boolean;
}

const SignalSensor: React.FC<SignalSensorProps> = ({
  redValue,
  signalRange,
  brightPixels,
  isActive
}) => {
  const [filteredSignal, setFilteredSignal] = useState(0);

  // Filtro de señal (media móvil)
  useEffect(() => {
    const bufferSize = 10;
    let buffer: number[] = [];

    const updateSignal = () => {
      buffer.push(redValue);
      if (buffer.length > bufferSize) buffer.shift();
      setFilteredSignal(buffer.reduce((a, b) => a + b, 0) / buffer.length);
    };

    updateSignal();
  }, [redValue]);

  const getSignalQuality = () => {
    if (!isActive) return { 
      quality: 0, 
      text: "COLOQUE SU DEDO EN LA CÁMARA", 
      color: "text-red-500",
      progressColor: "bg-red-500/20"
    };

    // Nueva lógica de calidad de señal con filtrado
    const quality = Math.min(100, Math.max(0, (
      (filteredSignal / 255) * 50 +  
      (1 - signalRange / 100) * 25 +  
      (brightPixels / 100) * 25  
    )));

    if (quality >= 75) return { 
      quality, 
      text: "SEÑAL ÓPTIMA", 
      color: "text-green-500",
      progressColor: "bg-green-500/20"
    };
    if (quality >= 50) return { 
      quality, 
      text: "SEÑAL MODERADA", 
      color: "text-yellow-500",
      progressColor: "bg-yellow-500/20"
    };

    return { 
      quality, 
      text: "SEÑAL DÉBIL", 
      color: "text-red-500",
      progressColor: "bg-red-500/20"
    };
  };

  const { quality, text, color, progressColor } = getSignalQuality();

  return (
    <div className="flex flex-col items-center space-y-2">
      <Signal className={cn("w-6 h-6", color)} />
      <span className={cn("text-sm font-medium", color)}>{text}</span>
      <Progress value={quality} className={cn("w-full h-2", progressColor)} />
    </div>
  );
};

export default SignalSensor;
