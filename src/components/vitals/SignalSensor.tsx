
import React from 'react';
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
  const getSignalQuality = () => {
    if (!isActive) return { quality: 0, text: "SIN SEÑAL", color: "text-red-500" };
    
    const quality = Math.min(100, Math.max(0, (redValue / 255) * 100));
    
    if (quality >= 75) return { 
      quality, 
      text: "SEÑAL EXCELENTE", 
      color: "text-green-500",
      progressColor: "bg-green-500"
    };
    if (quality >= 50) return { 
      quality, 
      text: "SEÑAL BUENA", 
      color: "text-blue-500",
      progressColor: "bg-blue-500"
    };
    if (quality >= 25) return { 
      quality, 
      text: "SEÑAL DÉBIL", 
      color: "text-yellow-500",
      progressColor: "bg-yellow-500"
    };
    return { 
      quality, 
      text: "SEÑAL MUY DÉBIL", 
      color: "text-red-500",
      progressColor: "bg-red-500"
    };
  };

  const signalStatus = getSignalQuality();

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Signal className={cn(
              "w-5 h-5",
              signalStatus.color,
              isActive && "animate-pulse"
            )} />
            <span className="text-sm font-medium text-gray-200">Calidad de Señal</span>
          </div>
          <span className={cn("font-bold", signalStatus.color)}>
            {Math.round(signalStatus.quality)}%
          </span>
        </div>

        <Progress 
          value={signalStatus.quality} 
          className="h-2"
          indicatorClassName={cn(signalStatus.progressColor)}
        />

        <div className="text-center">
          <span className={cn("font-semibold text-sm", signalStatus.color)}>
            {signalStatus.text}
          </span>
        </div>
      </div>
    </div>
  );
};

export default SignalSensor;
