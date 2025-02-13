
import React from 'react';
import { Signal } from 'lucide-react';
import { cn } from "@/lib/utils";

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
  // Calcula la intensidad de la señal basada en los valores
  const getSignalStrength = () => {
    if (!isActive) return 0;
    const normalizedStrength = Math.min(100, Math.max(0, (redValue / 255) * 100));
    return Math.round(normalizedStrength);
  };

  const signalStrength = getSignalStrength();

  return (
    <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Signal className={cn(
              "w-5 h-5",
              isActive ? "text-green-500" : "text-red-500",
              isActive && "animate-pulse"
            )} />
            <span className="text-sm font-medium text-gray-200">Sensor PPG</span>
          </div>
          <span className={cn(
            "font-bold",
            isActive ? "text-green-500" : "text-red-500"
          )}>
            {signalStrength}%
          </span>
        </div>

        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
            <div>Valor Rojo: <span className="text-white">{Math.round(redValue)}</span></div>
            <div>Rango: <span className="text-white">{Math.round(signalRange)}</span></div>
            <div>Píxeles Activos: <span className="text-white">{brightPixels}</span></div>
            <div>Estado: <span className={isActive ? "text-green-500" : "text-red-500"}>
              {isActive ? "ACTIVO" : "INACTIVO"}
            </span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignalSensor;
