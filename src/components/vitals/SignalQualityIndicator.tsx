
import React from 'react';
import { Hand, SignalHigh, SignalMedium, SignalLow } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SignalQualityIndicatorProps {
  isStarted: boolean;
  measurementQuality: number;
  measurementProgress: number;
}

const SignalQualityIndicator: React.FC<SignalQualityIndicatorProps> = ({
  isStarted,
  measurementQuality,
  measurementProgress
}) => {
  if (!isStarted) return null;

  const getQualityColor = (quality: number) => {
    if (quality < 0.3) return "bg-red-500";
    if (quality < 0.6) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getSignalQualityIndicator = () => {
    if (measurementQuality === 0) {
      return (
        <div className="flex items-center space-x-2 text-gray-400 animate-pulse">
          <Hand className="w-6 h-6" />
          <span>No se detecta el dedo</span>
        </div>
      );
    }
    
    if (measurementQuality < 0.3) {
      return (
        <div className="flex items-center space-x-2 text-red-500">
          <SignalLow className="w-6 h-6" />
          <span>Señal débil - Ajuste la posición del dedo</span>
        </div>
      );
    }
    
    if (measurementQuality < 0.6) {
      return (
        <div className="flex items-center space-x-2 text-yellow-500">
          <SignalMedium className="w-6 h-6" />
          <span>Señal regular - Mantenga el dedo quieto</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 text-green-500">
        <SignalHigh className="w-6 h-6 animate-pulse" />
        <span>Señal excelente</span>
      </div>
    );
  };

  return (
    <>
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-400">
            <span>Progreso de la medición</span>
            <span>{Math.round(measurementProgress)}%</span>
          </div>
          <Progress value={measurementProgress} className="h-2" />
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
        <div className="space-y-4">
          {getSignalQualityIndicator()}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-gray-400">
              <span>Calidad de la señal</span>
              <span>{Math.round(measurementQuality * 100)}%</span>
            </div>
            <div className="h-2 bg-black/20 rounded-full overflow-hidden">
              <div 
                className={cn(
                  "h-full transition-all duration-300 ease-in-out",
                  getQualityColor(measurementQuality)
                )}
                style={{ width: `${measurementQuality * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignalQualityIndicator;
