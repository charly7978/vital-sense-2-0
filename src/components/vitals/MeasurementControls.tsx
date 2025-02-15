
import React from 'react';
import { PlayCircle, StopCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { useVitals } from "@/contexts/VitalsContext";

const MeasurementControls: React.FC = () => {
  const { isStarted, toggleMeasurement } = useVitals();

  return (
    <div className="w-full flex items-center justify-center">
      <Button
        onClick={toggleMeasurement}
        size="lg"
        variant={isStarted ? "destructive" : "default"}
        className="w-full md:w-auto min-w-[200px] text-lg gap-2"
      >
        {isStarted ? (
          <>
            <StopCircle className="w-5 h-5" />
            Detener Medición
          </>
        ) : (
          <>
            <PlayCircle className="w-5 h-5" />
            Iniciar Medición
          </>
        )}
      </Button>
    </div>
  );
};

export default MeasurementControls;
