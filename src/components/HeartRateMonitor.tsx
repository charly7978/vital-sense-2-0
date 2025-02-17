
import React from 'react';
import { useToast } from "@/hooks/use-toast";
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import VitalSignsDisplay from './vitals/VitalSignsDisplay';
import SignalQualityIndicator from './vitals/SignalQualityIndicator';
import MeasurementControls from './vitals/MeasurementControls';
import { PPGProcessor } from '../utils/ppgProcessor';
import { useVitals } from '@/contexts/VitalsContext';

const ppgProcessor = new PPGProcessor();

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
    measurementProgress,
    measurementQuality,
    toggleMeasurement,
    processFrame
  } = useVitals();

  const { toast } = useToast();

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      <VitalSignsDisplay
        bpm={bpm}
        spo2={spo2}
        systolic={systolic}
        diastolic={diastolic}
        hasArrhythmia={hasArrhythmia}
        arrhythmiaType={arrhythmiaType}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="space-y-4">
          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/5">
            <div className="aspect-video w-full overflow-hidden rounded-lg">
              <CameraView onFrame={processFrame} isActive={isStarted} />
            </div>
            {isStarted && bpm === 0 && (
              <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                <p className="text-yellow-300 text-sm">
                  Coloque su dedo sobre el lente de la cámara
                </p>
              </div>
            )}
          </div>

          <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/5">
            <h3 className="text-lg font-medium mb-2 text-gray-100">PPG en Tiempo Real</h3>
            <VitalChart data={readings} color="#ea384c" />
          </div>
        </div>

        <div className="space-y-4">
          {isStarted && (
            <SignalQualityIndicator
              isStarted={isStarted}
              measurementQuality={measurementQuality}
              measurementProgress={measurementProgress}
            />
          )}

          <MeasurementControls
            isStarted={isStarted}
            onToggleMeasurement={toggleMeasurement}
          />
        </div>
      </div>
    </div>
  );
};

export default HeartRateMonitor;
