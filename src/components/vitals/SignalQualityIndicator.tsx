
import React from 'react';
import { Activity } from 'lucide-react';
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
  measurementProgress,
}) => {
  if (!isStarted) return null;

  // Conversión directa a porcentaje
  const qualityPercentage = Math.round(measurementQuality * 100);

  // Estado de calidad instantáneo
  const getQualityStatus = () => {
    if (qualityPercentage >= 80) return { color: 'text-green-500', text: 'SEÑAL FUERTE' };
    if (qualityPercentage >= 60) return { color: 'text-blue-500', text: 'SEÑAL BUENA' };
    if (qualityPercentage >= 40) return { color: 'text-yellow-500', text: 'SEÑAL MEDIA' };
    if (qualityPercentage >= 20) return { color: 'text-orange-500', text: 'SEÑAL DÉBIL' };
    return { color: 'text-red-500', text: 'SIN SEÑAL' };
  };

  const qualityStatus = getQualityStatus();

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
        "bg-black/30 backdrop-blur-sm rounded-xl p-4 transition-all duration-300",
        qualityStatus.color
      )}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Activity className={cn("w-5 h-5", qualityStatus.color)} />
              <span className="text-sm font-medium text-gray-200">Intensidad de Señal</span>
            </div>
            <span className={cn("font-bold", qualityStatus.color)}>
              {qualityPercentage}%
            </span>
          </div>
          
          <div>
            <Progress 
              value={qualityPercentage} 
              className={cn(
                "h-2",
                qualityPercentage >= 80 && "bg-green-500/20",
                qualityPercentage >= 60 && qualityPercentage < 80 && "bg-blue-500/20",
                qualityPercentage >= 40 && qualityPercentage < 60 && "bg-yellow-500/20",
                qualityPercentage >= 20 && qualityPercentage < 40 && "bg-orange-500/20",
                qualityPercentage < 20 && "bg-red-500/20"
              )}
            />
          </div>

          <div className="text-center">
            <span className={cn("font-semibold text-sm", qualityStatus.color)}>
              {qualityStatus.text}
            </span>
          </div>
        </div>
      </div>
    </>
  );
};

export default SignalQualityIndicator;
