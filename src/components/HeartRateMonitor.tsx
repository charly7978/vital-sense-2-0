
import React from 'react';
import { useVitals } from '@/contexts/VitalsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from 'recharts';

const HeartRateMonitor: React.FC = () => {
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

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-black">
      {/* Cámara Preview */}
      <div className="absolute inset-0 z-10">
        <video
          id="cameraPreview"
          className="h-full w-full object-cover"
          playsInline
        />
      </div>

      {/* Overlay con Mediciones */}
      <div className="absolute inset-0 z-20 flex flex-col bg-black/50 p-6">
        {/* Header */}
        <div className="mb-6 flex justify-between">
          <h1 className="text-3xl font-bold text-white">
            BPM Monitor
          </h1>
          <div className="space-x-2">
            <Button
              variant={isProcessing ? "destructive" : "default"}
              onClick={isProcessing ? stopProcessing : startProcessing}
            >
              {isProcessing ? "Stop" : "Start"}
            </Button>
            <Button
              variant="outline"
              onClick={startCalibration}
              disabled={!isProcessing || isCalibrating}
            >
              Calibrate
            </Button>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
          {/* BPM Display */}
          <div className="md:col-span-4">
            <Card className="bg-black/70">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-white">Heart Rate</h2>
                <p className="text-4xl font-bold text-primary">
                  {vitals ? `${Math.round(vitals.bpm)} BPM` : '--'}
                </p>
                <div className="mt-4">
                  <p className="text-sm text-white/70">
                    Confidence: {vitals ? `${Math.round(vitals.confidence * 100)}%` : '--'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* PPG Graph */}
          <div className="md:col-span-8">
            <Card className="bg-black/70 h-[200px]">
              <CardContent className="p-6">
                <h2 className="text-lg font-semibold text-white">PPG Signal</h2>
                <div className="h-[140px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={ppgData}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        dot={false}
                        isAnimationActive={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Signal Quality Indicators */}
        <div className="absolute bottom-6 left-6 right-6 flex gap-4">
          <QualityIndicator
            label="Signal"
            value={signalQuality.signal}
            color="bg-emerald-500"
          />
          <QualityIndicator
            label="Noise"
            value={1 - signalQuality.noise}
            color="bg-yellow-500"
          />
          <QualityIndicator
            label="Movement"
            value={1 - signalQuality.movement}
            color="bg-red-500"
          />
        </div>
      </div>

      {/* Calibration Overlay */}
      {isCalibrating && (
        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80">
          <div className="h-20 w-20 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <h2 className="mt-4 text-2xl font-semibold text-white">
            Calibrating... {Math.round(calibrationProgress * 100)}%
          </h2>
          <p className="mt-2 text-white/70">
            Please hold still
          </p>
        </div>
      )}
    </div>
  );
};

// Componente auxiliar para los indicadores de calidad
const QualityIndicator = ({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number; 
  color: string; 
}) => {
  return (
    <div className="flex-1 rounded bg-black/70 p-4">
      <p className="text-sm text-white">{label}</p>
      <Progress 
        value={value * 100} 
        className="mt-2 h-1 bg-white/10"
        indicatorClassName={color}
      />
    </div>
  );
};

export default HeartRateMonitor;
