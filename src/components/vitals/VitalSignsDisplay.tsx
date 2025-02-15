
import React from 'react';
import { Heart, Droplets, Activity, AlertTriangle } from 'lucide-react';
import { cn } from "@/lib/utils";

interface VitalSignsDisplayProps {
  bpm: number;
  spo2: number;
  systolic: number;
  diastolic: number;
  hasArrhythmia: boolean;
  arrhythmiaType: string;
}

const VitalSignsDisplay: React.FC<VitalSignsDisplayProps> = ({
  bpm,
  spo2,
  systolic,
  diastolic,
  hasArrhythmia,
  arrhythmiaType
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <Heart className={cn(
                "w-6 h-6 text-[#ea384c]",
                bpm > 0 && "animate-[pulse_1s_ease-in-out_infinite]"
              )} />
              {bpm > 0 && (
                <div className="absolute -inset-1 bg-[#ea384c]/20 rounded-full animate-[ping_1s_ease-in-out_infinite]" />
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-100">Heart Rate</h2>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-gray-100">{Math.round(bpm) || 0}</span>
            <span className="text-sm text-gray-300">BPM</span>
          </div>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Droplets className="w-6 h-6 text-[#3b82f6]" />
            <h2 className="text-xl font-semibold text-gray-100">SpO2</h2>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-gray-100">{Math.round(spo2) || 0}</span>
            <span className="text-sm text-gray-300">%</span>
          </div>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-[#10b981]" />
            <h2 className="text-xl font-semibold text-gray-100">Blood Pressure</h2>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-gray-100">{Math.round(systolic) || 0}/{Math.round(diastolic) || 0}</span>
            <span className="text-sm text-gray-300">mmHg</span>
          </div>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`w-6 h-6 ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-[#10b981]'}`} />
            <h2 className="text-xl font-semibold text-gray-100">Rhythm</h2>
          </div>
          <div className="flex items-baseline">
            <span className={`text-xl font-bold ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-gray-100'}`}>
              {arrhythmiaType}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalSignsDisplay;
