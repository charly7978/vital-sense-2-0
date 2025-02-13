
import React, { useEffect, useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import VitalSignsDisplay from './vitals/VitalSignsDisplay';
import MeasurementControls from './vitals/MeasurementControls';
import SignalSensor from './vitals/SignalSensor';
import { useVitals } from '@/contexts/VitalsContext';

const HeartRateMonitor: React.FC = () => {
  const { toast } = useToast();
  const [sensorData, setSensorData] = useState({ redValue: 0, signalRange: 0, brightPixels: 0 });
  const { 
    bpm, 
    spo2, 
    systolic, 
    diastolic, 
    hasArrhythmia, 
    arrhythmiaType,
    readings,
    isStarted,
    fingerPresent,
    toggleMeasurement,
    processFrame
  } = useVitals();

  // Capturar los valores del sensor
  useEffect(() => {
    const originalLog = console.log;
    console.log = (...args) => {
      originalLog(...args);
      if (typeof args[0] === 'string' && args[0] === 'Detección de dedo:' && args[1]) {
        const data = args[1];
        setSensorData({
          redValue: data.redMedian || 0,
          signalRange: data.redRange || 0,
          brightPixels: data.totalBrightPixels || 0
        });
      }
    };

    return () => {
      console.log = originalLog;
      setSensorData({ redValue: 0, signalRange: 0, brightPixels: 0 });
    };
  }, []);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-5xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-2xl font-semibold text-gray-100">Monitor de Signos Vitales</h2>
        </div>

        <VitalSignsDisplay
          bpm={bpm}
          spo2={spo2}
          systolic={systolic}
          diastolic={diastolic}
          hasArrhythmia={hasArrhythmia}
          arrhythmiaType={arrhythmiaType}
        />

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
          <div className="aspect-video w-full max-w-md mx-auto">
            <CameraView onFrame={processFrame} isActive={isStarted} />
          </div>
        </div>

        <SignalSensor
          redValue={sensorData.redValue}
          signalRange={sensorData.signalRange}
          brightPixels={sensorData.brightPixels}
          isActive={fingerPresent}
        />
      </div>

      <div className="space-y-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
          <h3 className="text-lg font-medium mb-2 text-gray-100">Señal PPG en Tiempo Real</h3>
          <VitalChart data={readings} color="#ea384c" />
        </div>

        <MeasurementControls
          isStarted={isStarted}
          onToggleMeasurement={toggleMeasurement}
        />
      </div>
    </div>
  );
};

export default HeartRateMonitor;
