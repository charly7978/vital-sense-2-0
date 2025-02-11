
import React, { useState, useCallback } from 'react';
import { Heart, Droplets, Activity, AlertTriangle } from 'lucide-react';
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import { PPGProcessor } from '../utils/ppgProcessor';
import type { VitalReading } from '../utils/types';

const ppgProcessor = new PPGProcessor();

const HeartRateMonitor: React.FC = () => {
  const [bpm, setBpm] = useState<number>(0);
  const [spo2, setSpo2] = useState<number>(0);
  const [systolic, setSystolic] = useState<number>(0);
  const [diastolic, setDiastolic] = useState<number>(0);
  const [hasArrhythmia, setHasArrhythmia] = useState<boolean>(false);
  const [arrhythmiaType, setArrhythmiaType] = useState<string>('Normal');
  const [readings, setReadings] = useState<VitalReading[]>([]);

  const handleFrame = useCallback((imageData: ImageData) => {
    const vitals = ppgProcessor.processFrame(imageData);
    setBpm(vitals.bpm);
    setSpo2(vitals.spo2);
    setSystolic(vitals.systolic);
    setDiastolic(vitals.diastolic);
    setHasArrhythmia(vitals.hasArrhythmia);
    setArrhythmiaType(vitals.arrhythmiaType);
    setReadings(ppgProcessor.getReadings());
  }, []);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="flex items-center justify-between bg-black/5 backdrop-blur-sm rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <Heart className="w-5 h-5 sm:w-6 sm:h-6 text-[#ea384c]" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-100">Heart Rate</h2>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-4xl font-bold text-gray-100">{bpm}</span>
            <span className="text-xs sm:text-sm text-gray-300">BPM</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-black/5 backdrop-blur-sm rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 sm:w-6 sm:h-6 text-[#3b82f6]" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-100">SpO2</h2>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-4xl font-bold text-gray-100">{spo2}</span>
            <span className="text-xs sm:text-sm text-gray-300">%</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-black/5 backdrop-blur-sm rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6 text-[#10b981]" />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-100">Blood Pressure</h2>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl sm:text-4xl font-bold text-gray-100">{systolic}/{diastolic}</span>
            <span className="text-xs sm:text-sm text-gray-300">mmHg</span>
          </div>
        </div>

        <div className="flex items-center justify-between bg-black/5 backdrop-blur-sm rounded-xl p-3 sm:p-4">
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-5 h-5 sm:w-6 sm:h-6 ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-[#10b981]'}`} />
            <h2 className="text-lg sm:text-xl font-semibold text-gray-100">Rhythm</h2>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className={`text-lg sm:text-xl font-bold ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-gray-100'}`}>
              {arrhythmiaType}
            </span>
          </div>
        </div>
      </div>

      <CameraView onFrame={handleFrame} />
      
      <div className="bg-gradient-to-br from-black/5 to-black/10 backdrop-blur-lg rounded-xl p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-gray-100">Real-time PPG Signal</h3>
        <VitalChart data={readings} color="#ea384c" />
      </div>
    </div>
  );
};

export default HeartRateMonitor;
