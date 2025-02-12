
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

  const getSignalQualityIndicator = () => {
    if (measurementQuality === 0 || measurementQuality < 0.01) {
      return (
        <div className="flex items-center space-x-2 text-gray-400 animate-pulse">
          <Hand className="w-6 h-6" />
          <span>Coloque su dedo sobre la cámara</span>
        </div>
      );
    }
    
    if (measurementQuality < 0.25) {
      return (
        <div className="flex items-center space-x-2 text-red-500">
          <SignalLow className="w-6 h-6" />
          <span>Ajuste la posición del dedo</span>
        </div>
      );
    }
    
    if (measurementQuality < 0.8) {
      return (
        <div className="flex items-center space-x-2 text-yellow-500">
          <SignalMedium className="w-6 h-6" />
          <span>Mantenga el dedo estable</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 text-green-500">
        <SignalHigh className="w-6 h-6" />
        <span>Señal óptima</span>
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
            <Progress 
              value={measurementQuality * 100} 
              className={cn(
                "h-2",
                measurementQuality < 0.25 ? "destructive" : 
                measurementQuality < 0.8 ? "warning" : ""
              )}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default SignalQualityIndicator;
