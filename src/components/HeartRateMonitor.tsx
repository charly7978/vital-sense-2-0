
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import VitalSignsDisplay from './vitals/VitalSignsDisplay';
import MeasurementControls from './vitals/MeasurementControls';
import { useVitals } from '@/contexts/VitalsContext';

const HeartRateMonitor: React.FC = () => {
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
          {isStarted && (
            <div className={`mt-2 p-3 rounded-lg text-center ${
              fingerPresent 
                ? "bg-green-500/20 border border-green-500/30" 
                : "bg-red-500/20 border border-red-500/30"
            }`}>
              <p className={`text-lg font-medium ${
                fingerPresent ? "text-green-400" : "text-red-400"
              }`}>
                {fingerPresent ? "DEDO DETECTADO" : "COLOQUE EL DEDO EN LA CÁMARA"}
              </p>
            </div>
          )}
        </div>
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
