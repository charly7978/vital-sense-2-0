
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings } from 'lucide-react';
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import VitalSignsDisplay from './vitals/VitalSignsDisplay';
import SignalQualityIndicator from './vitals/SignalQualityIndicator';
import MeasurementControls from './vitals/MeasurementControls';
import CalibrationPanel from './CalibrationPanel';
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
    measurementProgress,
    measurementQuality,
    toggleMeasurement,
    processFrame,
    sensitivitySettings,
    updateSensitivitySettings
  } = useVitals();

  const showFingerIndicator = isStarted && measurementQuality < 0.2;

  return (
    <div className="relative h-screen w-screen overflow-hidden">
      <div className="absolute inset-0 z-0">
        <CameraView onFrame={processFrame} isActive={isStarted} />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/60 z-10" />

      <div className="absolute inset-0 z-20">
        <Tabs defaultValue="monitor" className="h-full w-full">
          <div className="absolute top-3 right-3">
            <TabsList className="bg-black/30 backdrop-blur-md border border-white/10">
              <TabsTrigger value="monitor">Monitor</TabsTrigger>
              <TabsTrigger value="calibration" className="gap-2">
                <Settings className="w-4 h-4" />
                Calibración
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="monitor" className="h-full m-0">
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
                  <div className="h-[80px]">
                    <VitalChart data={readings} color="#ea384c" />
                  </div>
                </div>
              </div>

              <div className="flex-grow" />

              <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
                <div className="w-40">
                  <MeasurementControls
                    isStarted={isStarted}
                    onToggleMeasurement={toggleMeasurement}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="calibration" className="h-full m-0 p-3">
            <CalibrationPanel 
              settings={sensitivitySettings}
              onUpdateSettings={updateSensitivitySettings}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default HeartRateMonitor;
