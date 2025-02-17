
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
    <div className="relative h-screen w-screen overflow-hidden">
      {/* Cámara a pantalla completa */}
      <div className="absolute inset-0 z-0">
        <CameraView onFrame={processFrame} isActive={isStarted} />
      </div>

      {/* Overlay con gradiente sutil */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 z-10" />

      {/* Contenido superpuesto */}
      <div className="absolute inset-0 z-20">
        <div className="h-full w-full p-3 flex flex-col">
          {/* Área superior - Indicadores y mensaje */}
          <div className="space-y-1.5">
            {isStarted && (
              <div className="bg-black/30 backdrop-blur-md rounded p-1.5 border border-white/10">
                <SignalQualityIndicator
                  isStarted={isStarted}
                  measurementQuality={measurementQuality}
                  measurementProgress={measurementProgress}
                />
              </div>
            )}
            
            {isStarted && bpm === 0 && (
              <div className="px-3 py-1 bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md rounded">
                <p className="text-yellow-300 text-xs text-center">
                  Coloque su dedo sobre el lente de la cámara
                </p>
              </div>
            )}
          </div>

          {/* Área de vitales */}
          <div className="mt-2">
            <div className="bg-black/30 backdrop-blur-md rounded p-2 border border-white/10">
              <VitalSignsDisplay
                bpm={bpm}
                spo2={spo2}
                systolic={systolic}
                diastolic={diastolic}
                hasArrhythmia={hasArrhythmia}
                arrhythmiaType={arrhythmiaType}
              />
            </div>
          </div>

          {/* Espacio flexible */}
          <div className="flex-grow" />

          {/* Gráfico PPG */}
          <div className="mb-4">
            <div className="bg-black rounded p-1.5 border border-white/10">
              <h3 className="text-[10px] font-medium mb-0.5 text-gray-100">PPG en Tiempo Real</h3>
              <div className="h-[60px]">
                <VitalChart data={readings} color="#ea384c" />
              </div>
            </div>
          </div>

          {/* Botón centrado */}
          <div className="mb-6 flex justify-center">
            <div className="w-48">
              <MeasurementControls
                isStarted={isStarted}
                onToggleMeasurement={toggleMeasurement}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartRateMonitor;
