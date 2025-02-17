
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
    <div className="grid grid-cols-2 gap-2">
      <div className="col-span-1 bg-black/30 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Heart className={cn(
                "w-5 h-5 text-[#ea384c]",
                bpm > 0 && "animate-[pulse_1s_ease-in-out_infinite]"
              )} />
              {bpm > 0 && (
                <div className="absolute -inset-1 bg-[#ea384c]/20 rounded-full animate-[ping_1s_ease-in-out_infinite]" />
              )}
            </div>
            <span className="text-sm font-semibold text-gray-100">BPM</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-100">{bpm > 0 ? Math.round(bpm) : '--'}</span>
          </div>
        </div>
      </div>

      <div className="col-span-1 bg-black/30 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Droplets className="w-5 h-5 text-[#3b82f6]" />
            <span className="text-sm font-semibold text-gray-100">SpO2</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-100">{spo2 > 0 ? Math.round(spo2) : '--'}</span>
            <span className="text-xs text-gray-300">%</span>
          </div>
        </div>
      </div>

      <div className="col-span-1 bg-black/30 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Activity className="w-5 h-5 text-[#10b981]" />
            <span className="text-sm font-semibold text-gray-100">BP</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-gray-100">
              {systolic > 0 && diastolic > 0 ? `${Math.round(systolic)}/${Math.round(diastolic)}` : '--/--'}
            </span>
          </div>
        </div>
      </div>

      <div className="col-span-1 bg-black/30 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className={`w-5 h-5 ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-[#10b981]'}`} />
            <span className="text-sm font-semibold text-gray-100">Ritmo</span>
          </div>
          <div className="flex items-baseline">
            <span className={`text-sm font-bold ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-gray-100'}`}>
              {arrhythmiaType}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalSignsDisplay;
