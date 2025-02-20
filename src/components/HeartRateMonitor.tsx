
import React, { useState } from 'react';
import { Activity } from 'lucide-react';
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import VitalSignsDisplay from './vitals/VitalSignsDisplay';
import SignalQualityIndicator from './vitals/SignalQualityIndicator';
import MeasurementControls from './vitals/MeasurementControls';
import AutoCalibrationButton from './vitals/AutoCalibrationButton';
import { useVitals } from '@/contexts/VitalsContext';
import { Button } from "@/components/ui/button";

interface HeartRateMonitorProps {
  onShowControls: () => void;
}

const HeartRateMonitor: React.FC<HeartRateMonitorProps> = ({ onShowControls }) => {
  const [currentView, setCurrentView] = useState<'monitor' | 'calibration'>('monitor');
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
    processFrame,
    resetMeasurement
  } = useVitals();

  const showFingerIndicator = isStarted && measurementQuality < 0.2;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <CameraView onFrame={processFrame} isActive={isStarted} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 z-10" />

      <div className="absolute inset-0 z-20">
        <div className="h-full w-full relative">
          {/* Vista del Monitor */}
          <div className="absolute inset-0 transition-all duration-500">
            <div className="h-full w-full p-3 flex flex-col">
              <div className="space-y-2">
                {isStarted && (
                  <div className="bg-black/30 backdrop-blur-md rounded-lg p-2 border border-white/10">
                    <SignalQualityIndicator
                      isStarted={isStarted}
                      measurementQuality={measurementQuality}
                      measurementProgress={measurementProgress}
                    />
                  </div>
                )}
                
                {showFingerIndicator && (
                  <div className="px-3 py-2 bg-yellow-500/10 border border-yellow-500/20 backdrop-blur-md rounded-lg">
                    <div className="flex items-center justify-center space-x-2">
                      <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"/>
                      <p className="text-yellow-300 text-xs">
                        Coloque su dedo sobre el lente de la cámara
                      </p>
                    </div>
                  </div>
                )}

                {isStarted && (
                  <>
                    <div className="bg-black/30 backdrop-blur-md rounded-lg p-2 border border-white/10">
                      <AutoCalibrationButton />
                    </div>
                    
                    {/* Animación de Calibración */}
                    <div className="relative overflow-hidden rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md p-4 border border-white/10">
                      <div className="flex items-center justify-center space-x-3">
                        <Activity className="w-5 h-5 text-blue-400 animate-pulse" />
                        <div className="flex flex-col items-start">
                          <div className="flex space-x-2 items-center">
                            <span className="h-1.5 w-1.5 rounded-full bg-blue-400 animate-ping" />
                            <span className="text-sm text-blue-100">Amplificación de Señal</span>
                          </div>
                          <div className="mt-1 h-1 w-full bg-black/20 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-400/50 rounded-full animate-[wave_2s_ease-in-out_infinite]" 
                                 style={{ width: `${measurementQuality * 100}%` }} />
                          </div>
                        </div>
                      </div>
                      
                      <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-blue-500/10 rounded-full filter blur-xl animate-pulse" />
                      <div className="absolute -top-6 -right-6 w-32 h-32 bg-purple-500/10 rounded-full filter blur-xl animate-pulse" />
                    </div>
                  </>
                )}
              </div>

              <div className="mt-3 space-y-2">
                <div className="bg-black/30 backdrop-blur-md rounded-lg p-2.5 border border-white/10">
                  <VitalSignsDisplay
                    bpm={bpm}
                    spo2={spo2}
                    systolic={systolic}
                    diastolic={diastolic}
                    hasArrhythmia={hasArrhythmia}
                    arrhythmiaType={arrhythmiaType}
                  />
                </div>

                <div className="rounded-lg p-2">
                  <h3 className="text-xs font-medium mb-1 text-gray-100">PPG en Tiempo Real</h3>
                  <div className="h-[50px]">
                    <VitalChart data={readings} color="#ea384c" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Controles fijos en la parte inferior */}
          <div className="absolute bottom-6 left-0 right-0 px-4 z-30">
            <div className="flex flex-col gap-2 items-center">
              <MeasurementControls
                isStarted={isStarted}
                onToggleMeasurement={toggleMeasurement}
              />
              {isStarted && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetMeasurement}
                  className="w-40 text-sm"
                >
                  Reiniciar Medición
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeartRateMonitor;
