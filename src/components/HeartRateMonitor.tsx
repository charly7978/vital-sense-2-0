
import React from 'react';
import { useVitals } from '@/contexts/VitalsContext';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface HeartRateMonitorProps {
  onShowControls: () => void;
}

const HeartRateMonitor: React.FC<HeartRateMonitorProps> = ({ onShowControls }) => {
  const { vitals, isProcessing, startProcessing, stopProcessing } = useVitals();

  return (
    <div className="w-full h-full flex items-center justify-center">
      <Card className="w-full max-w-md p-6 space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">
            {vitals?.bpm ? `${Math.round(vitals.bpm)} BPM` : 'Heart Rate Monitor'}
          </h2>
          <p className="text-gray-500">
            {isProcessing ? 'Monitoring...' : 'Ready to start'}
          </p>
        </div>

        <div className="space-y-4">
          {isProcessing && (
            <Progress 
              value={vitals?.quality ? vitals.quality * 100 : 0} 
              className="w-full"
            />
          )}

          <div className="flex gap-4">
            <Button
              className="flex-1"
              variant={isProcessing ? "destructive" : "default"}
              onClick={() => isProcessing ? stopProcessing() : startProcessing()}
            >
              {isProcessing ? 'Stop' : 'Start'}
            </Button>
            <Button
              variant="outline"
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
