
import React from 'react';
import { Hand, SignalHigh, SignalMedium, SignalLow } from 'lucide-react';
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SignalQualityIndicatorProps {
  isStarted: boolean;
  measurementQuality: number;
  measurementProgress: number;
  fingerPresent: boolean;
}

const SignalQualityIndicator: React.FC<SignalQualityIndicatorProps> = ({
  isStarted,
  measurementQuality,
  measurementProgress,
  fingerPresent
}) => {
  if (!isStarted) return null;

  const getSignalQualityIndicator = () => {
    if (!fingerPresent) {
      return (
        <div className="flex items-center space-x-2 text-red-500 animate-pulse">
          <Hand className="w-6 h-6" />
          <span className="font-semibold">DEDO NO DETECTADO</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 text-green-500">
        <SignalHigh className="w-6 h-6" />
        <span className="font-semibold">DEDO DETECTADO</span>
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

      <div className={cn(
        "bg-black/30 backdrop-blur-sm rounded-xl p-4",
        fingerPresent ? "border border-green-500/20" : "border border-red-500/20"
      )}>
        <div className="space-y-4">
          {getSignalQualityIndicator()}
          {fingerPresent && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-400">
                <span>Calidad de la señal</span>
                <span>{Math.round(measurementQuality * 100)}%</span>
              </div>
              <Progress 
                value={measurementQuality * 100} 
                className="h-2"
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SignalQualityIndicator;
