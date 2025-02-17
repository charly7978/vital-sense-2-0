
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
    <div className="space-y-4 max-w-3xl mx-auto">
      {/* Panel de cámara y controles - Siempre visible en el centro */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 
                    w-full max-w-sm mx-auto z-10 px-4">
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/5 shadow-lg">
          <div className="aspect-[3/4] w-full overflow-hidden rounded-lg">
            <CameraView onFrame={processFrame} isActive={isStarted} />
          </div>
          {isStarted && bpm === 0 && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-300 text-sm text-center">
                Coloque su dedo sobre el lente de la cámara
              </p>
            </div>
          )}
          <div className="mt-4">
            <MeasurementControls
              isStarted={isStarted}
              onToggleMeasurement={toggleMeasurement}
            />
          </div>
        </div>
      </div>

      {/* Panel superior con signos vitales - Se desplaza detrás de la cámara */}
      <div className="pt-4">
        <VitalSignsDisplay
          bpm={bpm}
          spo2={spo2}
          systolic={systolic}
          diastolic={diastolic}
          hasArrhythmia={hasArrhythmia}
          arrhythmiaType={arrhythmiaType}
        />
      </div>

      {/* Panel inferior con gráfica y calidad de señal - Se desplaza detrás de la cámara */}
      <div className="pb-4 space-y-4">
        {isStarted && (
          <SignalQualityIndicator
            isStarted={isStarted}
            measurementQuality={measurementQuality}
            measurementProgress={measurementProgress}
          />
        )}

        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-4 border border-white/5">
          <h3 className="text-lg font-medium mb-2 text-gray-100">PPG en Tiempo Real</h3>
          <VitalChart data={readings} color="#ea384c" />
        </div>
      </div>
    </div>
  );
};

export default HeartRateMonitor;
