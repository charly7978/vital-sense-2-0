
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
    <div className="container max-w-xl mx-auto px-2">
      {/* Cámara centrada en la parte superior */}
      <div className="flex justify-center mb-2">
        <div className="w-32 aspect-[3/4] bg-black/40 backdrop-blur-xl rounded-lg p-1.5 border border-white/5 shadow-lg">
          <div className="w-full h-full overflow-hidden rounded-md">
            <CameraView onFrame={processFrame} isActive={isStarted} />
          </div>
        </div>
      </div>

      {/* Controles y mensaje de ayuda */}
      <div className="flex flex-col items-center space-y-1 mb-2">
        {isStarted && bpm === 0 && (
          <div className="p-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded text-center w-full">
            <p className="text-yellow-300 text-xs">
              Coloque su dedo sobre el lente
            </p>
          </div>
        )}
        
        <div className="w-full max-w-xs">
          <MeasurementControls
            isStarted={isStarted}
            onToggleMeasurement={toggleMeasurement}
          />
        </div>

        {isStarted && (
          <div className="w-full max-w-xs">
            <SignalQualityIndicator
              isStarted={isStarted}
              measurementQuality={measurementQuality}
              measurementProgress={measurementProgress}
            />
          </div>
        )}
      </div>

      {/* Grid de 2 columnas para métricas y gráfico */}
      <div className="grid grid-cols-2 gap-2">
        {/* Columna izquierda - Signos vitales */}
        <div className="bg-black/40 backdrop-blur-xl rounded-lg p-2 border border-white/5">
          <VitalSignsDisplay
            bpm={bpm}
            spo2={spo2}
            systolic={systolic}
            diastolic={diastolic}
            hasArrhythmia={hasArrhythmia}
            arrhythmiaType={arrhythmiaType}
          />
        </div>

        {/* Columna derecha - Gráfico PPG */}
        <div className="bg-black/40 backdrop-blur-xl rounded-lg p-2 border border-white/5">
          <h3 className="text-xs font-medium mb-1 text-gray-100">PPG en Tiempo Real</h3>
          <div className="h-[120px]">
            <VitalChart data={readings} color="#ea384c" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartRateMonitor;
