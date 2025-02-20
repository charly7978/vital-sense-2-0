
import React from 'react';
import { PlayCircle, StopCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";

interface MeasurementControlsProps {
  isStarted: boolean;
  onToggleMeasurement: () => void;
}

const MeasurementControls: React.FC<MeasurementControlsProps> = ({
  isStarted,
  onToggleMeasurement
}) => {
  return (
    <div className="w-full flex items-center justify-center">
      <Button
        onClick={onToggleMeasurement}
        size="sm"
        variant={isStarted ? "destructive" : "default"}
        className="w-full md:w-auto min-w-[150px] text-sm gap-2"
      >
        {isStarted ? (
          <>
            <StopCircle className="w-4 h-4" />
            Detener
          </>
        ) : (
          <>
            <PlayCircle className="w-4 h-4" />
            Iniciar
          </>
        )}
      </Button>
    </div>
  );
};

export default MeasurementControls;
