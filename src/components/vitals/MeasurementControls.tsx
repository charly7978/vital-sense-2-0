
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
    <div className="flex justify-center">
      <Button
        onClick={onToggleMeasurement}
        className={`px-6 py-3 text-lg ${isStarted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
      >
        {isStarted ? (
          <>
            <StopCircle className="mr-2" />
            Detener Medición
          </>
        ) : (
          <>
            <PlayCircle className="mr-2" />
            Iniciar Medición
          </>
        )}
      </Button>
    </div>
  );
};

export default MeasurementControls;
