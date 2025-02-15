
import React, { useEffect, useState } from 'react';
import { Signal, Fingerprint } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";

interface SignalSensorProps {
  redValue: number;
  signalRange: number;
  brightPixels: number;
  isActive: boolean;
}

const SignalSensor: React.FC<SignalSensorProps> = ({
  redValue = 0,  
  signalRange = 0,
  brightPixels = 0,
  isActive = false
}) => {
  const [filteredSignal, setFilteredSignal] = useState(0);

  useEffect(() => {
    const bufferSize = 15;
    let buffer: number[] = [];

    const updateSignal = () => {
      buffer.push(redValue);
      if (buffer.length > bufferSize) buffer.shift();
      const newFilteredSignal = buffer.reduce((a, b) => a + b, 0) / buffer.length;
      setFilteredSignal(newFilteredSignal);
      
      console.log('📊 Análisis de señal PPG:', {
        señalRaw: redValue,
        señalFiltrada: newFilteredSignal,
        rangoSeñal: signalRange,
        pixelesValidos: brightPixels,
        dedoDetectado: isActive,
        calidadSeñal: getSignalQuality().quality
      });
    };

    updateSignal();
  }, [redValue, signalRange, brightPixels, isActive]);

  const getSignalQuality = () => {
    if (!isActive || filteredSignal < 50) return { 
      quality: 0, 
      text: "COLOQUE SU DEDO EN LA CÁMARA", 
      color: "text-red-500",
      progressColor: "bg-red-500/20"
    };

    const quality = Math.min(100, Math.max(0, (
      (filteredSignal / 255) * 50 +  
      (1 - signalRange / 100) * 25 +  
      (brightPixels / 100) * 25  
    )));

    if (quality >= 80) return { 
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
      <div className="flex items-center space-x-2">
        <Signal className={cn("w-6 h-6", color)} />
        <Fingerprint 
          className={cn(
            "w-6 h-6 transition-all duration-300",
            isActive ? "text-green-500 scale-110" : "text-red-500 scale-90 opacity-50"
          )}
        />
      </div>
      <span className={cn("text-sm font-medium", color)}>{text}</span>
      <Progress value={quality} className={cn("w-full h-2", progressColor)} />
    </div>
  );
};

export default SignalSensor;
