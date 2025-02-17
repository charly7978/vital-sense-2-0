
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mx-auto max-w-4xl">
      {/* Heart Rate */}
      <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/5">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <div className="relative bg-[#ea384c]/10 p-2 rounded-lg">
              <Heart className={cn(
                "w-6 h-6 text-[#ea384c]",
                bpm > 0 && "animate-[pulse_1s_ease-in-out_infinite]"
              )} />
              {bpm > 0 && (
                <div className="absolute -inset-1 bg-[#ea384c]/20 rounded-full animate-[ping_1s_ease-in-out_infinite]" />
              )}
            </div>
            <h2 className="text-lg font-medium text-gray-200">Heart Rate</h2>
          </div>
          <div className="flex items-baseline justify-end space-x-2">
            <span className="text-3xl font-bold text-gray-100 tracking-tight">{bpm > 0 ? Math.round(bpm) : '--'}</span>
            <span className="text-sm font-medium text-gray-400">BPM</span>
          </div>
        </div>
      </div>

      {/* SpO2 */}
      <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/5">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-[#3b82f6]/10 p-2 rounded-lg">
              <Droplets className="w-6 h-6 text-[#3b82f6]" />
            </div>
            <h2 className="text-lg font-medium text-gray-200">SpO2</h2>
          </div>
          <div className="flex items-baseline justify-end space-x-2">
            <span className="text-3xl font-bold text-gray-100 tracking-tight">{spo2 > 0 ? Math.round(spo2) : '--'}</span>
            <span className="text-sm font-medium text-gray-400">%</span>
          </div>
        </div>
      </div>

      {/* Blood Pressure */}
      <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/5">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <div className="bg-[#10b981]/10 p-2 rounded-lg">
              <Activity className="w-6 h-6 text-[#10b981]" />
            </div>
            <h2 className="text-lg font-medium text-gray-200">Blood Pressure</h2>
          </div>
          <div className="flex items-baseline justify-end space-x-2">
            <span className="text-3xl font-bold text-gray-100 tracking-tight">
              {systolic > 0 && diastolic > 0 ? `${Math.round(systolic)}/${Math.round(diastolic)}` : '--/--'}
            </span>
            <span className="text-sm font-medium text-gray-400">mmHg</span>
          </div>
        </div>
      </div>

      {/* Rhythm */}
      <div className="bg-gradient-to-br from-black/40 to-black/20 backdrop-blur-lg rounded-2xl p-6 shadow-lg border border-white/5">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-3">
            <div className={`bg-${hasArrhythmia ? '[#f59e0b]' : '[#10b981]'}/10 p-2 rounded-lg`}>
              <AlertTriangle className={`w-6 h-6 ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-[#10b981]'}`} />
            </div>
            <h2 className="text-lg font-medium text-gray-200">Rhythm</h2>
          </div>
          <div className="flex items-baseline justify-end">
            <span className={`text-xl font-bold tracking-tight ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-gray-100'}`}>
              {arrhythmiaType}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VitalSignsDisplay;
