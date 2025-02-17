
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
    <div className="container max-w-5xl mx-auto p-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Columna izquierda - Signos vitales */}
        <div className="md:order-1">
          <VitalSignsDisplay
            bpm={bpm}
            spo2={spo2}
            systolic={systolic}
            diastolic={diastolic}
            hasArrhythmia={hasArrhythmia}
            arrhythmiaType={arrhythmiaType}
          />
        </div>

        {/* Columna central - Cámara y controles */}
        <div className="md:order-2 flex flex-col items-center">
          <div className="w-48 aspect-[3/4] bg-black/40 backdrop-blur-xl rounded-xl p-2 border border-white/5 shadow-lg">
            <div className="w-full h-full overflow-hidden rounded-lg">
              <CameraView onFrame={processFrame} isActive={isStarted} />
            </div>
          </div>

          {isStarted && bpm === 0 && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-center w-full">
              <p className="text-yellow-300 text-xs">
                Coloque su dedo sobre el lente
              </p>
            </div>
          )}

          <div className="mt-2 w-full">
            <MeasurementControls
              isStarted={isStarted}
              onToggleMeasurement={toggleMeasurement}
            />
          </div>

          {isStarted && (
            <div className="mt-2 w-full">
              <SignalQualityIndicator
                isStarted={isStarted}
                measurementQuality={measurementQuality}
                measurementProgress={measurementProgress}
              />
            </div>
          )}
        </div>

        {/* Columna derecha - Gráfico PPG */}
        <div className="md:order-3">
          <div className="bg-black/40 backdrop-blur-xl rounded-xl p-3 border border-white/5 h-full">
            <h3 className="text-sm font-medium mb-2 text-gray-100">PPG en Tiempo Real</h3>
            <div className="h-[200px]">
              <VitalChart data={readings} color="#ea384c" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartRateMonitor;
