
import React, { useState, useCallback } from 'react';
import { Heart } from 'lucide-react';
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import { PPGProcessor } from '../utils/ppgProcessor';
import type { VitalReading } from '../utils/types';

const ppgProcessor = new PPGProcessor();

const HeartRateMonitor: React.FC = () => {
  const [bpm, setBpm] = useState<number>(0);
  const [readings, setReadings] = useState<VitalReading[]>([]);

  const handleFrame = useCallback((imageData: ImageData) => {
    const newBpm = ppgProcessor.processFrame(imageData);
    setBpm(newBpm);
    setReadings(ppgProcessor.getReadings());
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Heart className="w-6 h-6 text-[#ea384c]" />
          <h2 className="text-xl font-semibold">Heart Rate Monitor</h2>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-4xl font-bold">{bpm}</span>
          <span className="text-sm text-gray-400">BPM</span>
        </div>
      </div>

      <CameraView onFrame={handleFrame} />
      
      <div className="bg-gradient-to-br from-black/5 to-black/10 backdrop-blur-lg rounded-xl p-6">
        <h3 className="text-lg font-medium mb-4">Real-time PPG Signal</h3>
        <VitalChart data={readings} color="#ea384c" />
      </div>
    </div>
  );
};

export default HeartRateMonitor;
