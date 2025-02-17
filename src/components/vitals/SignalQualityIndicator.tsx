
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
    if (quality < 0.4) return "bg-red-500";
    if (quality < 0.7) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getSignalQualityIndicator = () => {
    if (measurementQuality < 0.2) {
      return (
        <div className="flex items-center space-x-1">
          <Hand className="w-3 h-3" />
          <span className="text-[9px]">No señal</span>
        </div>
      );
    }
    
    if (measurementQuality < 0.4) {
      return (
        <div className="flex items-center space-x-1">
          <SignalLow className="w-3 h-3" />
          <span className="text-[9px]">Baja</span>
        </div>
      );
    }
    
    if (measurementQuality < 0.7) {
      return (
        <div className="flex items-center space-x-1">
          <SignalMedium className="w-3 h-3" />
          <span className="text-[9px]">Regular</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-1">
        <SignalHigh className="w-3 h-3" />
        <span className="text-[9px]">Excelente</span>
      </div>
    );
  };

  return (
    <div className="flex justify-between space-x-2">
      {/* Progreso de medición */}
      <div className="flex-1">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[9px] text-gray-400">
            <span>Progreso</span>
            <span>{Math.round(measurementProgress)}%</span>
          </div>
          <Progress value={measurementProgress} className="h-1" />
        </div>
      </div>

      {/* Calidad de señal */}
      <div className="flex-1">
        <div className="space-y-0.5">
          <div className="flex items-center justify-between text-[9px] text-gray-400">
            <span>Calidad</span>
            <span>{Math.round(measurementQuality * 100)}%</span>
          </div>
          <div className="h-1 bg-black/20 rounded-full overflow-hidden">
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
  );
};

export default SignalQualityIndicator;
