
import React from 'react';
import { useVitals } from '@/contexts/VitalsContext';
import CameraView from '../CameraView';
import MeasurementControls from './MeasurementControls';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';
import { SignalQualityLevel, SignalQualityLevelType } from '@/types';
import { Card } from '../ui/card';

export function VitalsMonitor() {
  const {
    vitals,
    isProcessing,
    isCalibrating,
    calibrationProgress,
    signalQuality,
    ppgData,
    startProcessing,
    stopProcessing,
    startCalibration
  } = useVitals();

  const handleToggleMeasurement = () => {
    if (isProcessing) {
      stopProcessing();
    } else {
      startProcessing();
    }
  };

  return (
    <div className="relative h-screen w-screen bg-black overflow-hidden">
      {/* Camera View */}
      <div className="absolute inset-0">
        <CameraView
          enabled={isProcessing}
          onFrame={() => {}} // Frame is handled in VitalsContext
        />
      </div>

      {/* Data Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm">
        <div className="h-full w-full flex flex-col p-4 gap-4">
          {/* Vital Signs */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* BPM and Quality */}
            <Card className="bg-black/40">
              <div className="p-4 flex flex-col justify-center items-center">
                <h2 className="text-2xl font-bold text-white/80">Heart Rate</h2>
                <div className="text-6xl font-bold text-white mt-2">
                  {vitals?.bpm ? Math.round(vitals.bpm) : '--'}
                </div>
                <div className="text-white/60 mt-2">BPM</div>
                <div className={`mt-4 px-3 py-1 rounded-full ${getQualityColor(signalQuality?.level)}`}>
                  {signalQuality?.level || 'Invalid'}
                </div>
              </div>
            </Card>

            {/* PPG Graph */}
            <Card className="bg-black/40">
              <div className="p-4">
                <h2 className="text-xl font-bold text-white/80 mb-2">PPG Signal</h2>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ppgData}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </Card>
          </div>

          {/* Quality Indicators */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <QualityIndicator
              label="Signal"
              value={signalQuality?.overall || 0}
              color="hsl(var(--primary))"
            />
            <QualityIndicator
              label="Confidence"
              value={signalQuality?.confidence || 0}
              color="hsl(var(--blue-500))"
            />
            <QualityIndicator
              label="Stability"
              value={signalQuality?.score || 0}
              color="hsl(var(--pink-500))"
            />
            <QualityIndicator
              label="Quality"
              value={signalQuality?.overall || 0}
              color="hsl(var(--yellow-500))"
            />
          </div>

          {/* Controls */}
          <div className="pb-4">
            <MeasurementControls
              isStarted={isProcessing}
              onToggleMeasurement={handleToggleMeasurement}
            />
          </div>
        </div>
      </div>

      {/* Calibration Overlay */}
      {isCalibrating && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-t-primary rounded-full animate-spin mx-auto" />
            <h2 className="text-2xl font-bold text-white mt-4">Calibrating...</h2>
            <div className="w-64 bg-white/20 rounded-full h-2 mt-4">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300"
                style={{ width: `${calibrationProgress * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface QualityIndicatorProps {
  label: string;
  value: number;
  color: string;
}

function QualityIndicator({ label, value, color }: QualityIndicatorProps) {
  return (
    <Card className="bg-black/40">
      <div className="p-3">
        <div className="text-sm text-white/60">{label}</div>
        <div className="h-1 bg-white/10 rounded-full mt-2">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${value * 100}%`,
              backgroundColor: color
            }}
          />
        </div>
      </div>
    </Card>
  );
}

function getQualityColor(level?: SignalQualityLevelType): string {
  if (!level) return 'bg-red-500 text-white';
  
  switch (level) {
    case SignalQualityLevel.Excellent:
      return 'bg-emerald-500 text-white';
    case SignalQualityLevel.Good:
      return 'bg-sky-500 text-white';
    case SignalQualityLevel.Fair:
      return 'bg-yellow-500 text-black';
    case SignalQualityLevel.Poor:
      return 'bg-orange-500 text-white';
    default:
      return 'bg-red-500 text-white';
  }
}

export default VitalsMonitor;
