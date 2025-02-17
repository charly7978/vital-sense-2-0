
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mx-auto max-w-3xl">
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 shadow-lg flex flex-col">
        <div className="flex items-center justify-between w-full">
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
            <h2 className="text-lg font-semibold text-gray-100">Heart Rate</h2>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-100 min-w-[3ch] text-center">{bpm > 0 ? Math.round(bpm) : '--'}</span>
            <span className="text-sm text-gray-300">BPM</span>
          </div>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 shadow-lg flex flex-col">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Droplets className="w-6 h-6 text-[#3b82f6]" />
            <h2 className="text-lg font-semibold text-gray-100">SpO2</h2>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-100 min-w-[3ch] text-center">{spo2 > 0 ? Math.round(spo2) : '--'}</span>
            <span className="text-sm text-gray-300">%</span>
          </div>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 shadow-lg flex flex-col">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 text-[#10b981]" />
            <h2 className="text-lg font-semibold text-gray-100">Blood Pressure</h2>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-2xl font-bold text-gray-100 min-w-[7ch] text-center">
              {systolic > 0 && diastolic > 0 ? `${Math.round(systolic)}/${Math.round(diastolic)}` : '--/--'}
            </span>
            <span className="text-sm text-gray-300">mmHg</span>
          </div>
        </div>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-6 shadow-lg flex flex-col">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center space-x-3">
            <AlertTriangle className={`w-6 h-6 ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-[#10b981]'}`} />
            <h2 className="text-lg font-semibold text-gray-100">Rhythm</h2>
          </div>
          <div className="flex items-baseline">
            <span className={`text-lg font-bold min-w-[4ch] text-center ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-gray-100'}`}>
              {arrhythmiaType}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalSignsDisplay;
