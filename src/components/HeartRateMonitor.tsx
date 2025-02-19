
import React from 'react';
import { useVitals } from '@/contexts/VitalsContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/components/ui/use-toast';

interface HeartRateMonitorProps {
  onShowControls: () => void;
}

const HeartRateMonitor: React.FC<HeartRateMonitorProps> = ({ onShowControls }) => {
  const { vitals, isProcessing, startProcessing, stopProcessing } = useVitals();

  const handleStart = async () => {
    try {
      await startProcessing();
    } catch (error) {
      toast({
        title: "Error",
        description: "No se pudo acceder a la cámara. Por favor, verifica los permisos.",
        variant: "destructive"
      });
    }
  };

  const handleStop = () => {
    stopProcessing();
    toast({
      title: "Monitoreo detenido",
      description: "Se ha detenido el monitoreo del ritmo cardíaco."
    });
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-b from-background/50 to-background p-4">
      <Card className="w-full max-w-md p-6 space-y-6 shadow-lg border-2">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">
            {vitals?.bpm ? `${Math.round(vitals.bpm)} BPM` : 'Heart Rate Monitor'}
          </h2>
          <p className="text-muted-foreground">
            {isProcessing ? 'Monitoring...' : 'Ready to start'}
          </p>
        </div>

        <div className="space-y-4">
          {isProcessing && (
            <div className="space-y-2">
              <Progress 
                value={vitals?.quality ? vitals.quality * 100 : 0} 
                className="w-full h-2"
              />
              <p className="text-sm text-muted-foreground text-center">
                Signal Quality: {vitals?.quality ? `${Math.round(vitals.quality * 100)}%` : 'Analyzing...'}
              </p>
            </div>
          )}

          <div className="flex gap-4">
            <Button
              className="flex-1 text-base font-medium"
              size="lg"
              variant={isProcessing ? "destructive" : "default"}
              onClick={isProcessing ? handleStop : handleStart}
            >
              {isProcessing ? 'Stop' : 'Start'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={onShowControls}
            >
              Settings
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HeartRateMonitor;
