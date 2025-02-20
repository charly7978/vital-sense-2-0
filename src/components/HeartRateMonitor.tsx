
import React, { useState, useCallback, useMemo } from 'react';
import { Settings } from 'lucide-react';
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import VitalSignsDisplay from './vitals/VitalSignsDisplay';
import SignalQualityIndicator from './vitals/SignalQualityIndicator';
import MeasurementControls from './vitals/MeasurementControls';
import CalibrationPanel from './CalibrationPanel';
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
    sensitivitySettings,
    updateSensitivitySettings,
    resetMeasurement
  } = useVitals();

  const showFingerIndicator = useMemo(() => 
    isStarted && measurementQuality < 0.2, 
    [isStarted, measurementQuality]
  );

  const handleViewChange = useCallback((view: 'monitor' | 'calibration') => {
    setCurrentView(view);
  }, []);

  return (
    <div className="fixed inset-0 flex flex-col bg-black overflow-hidden">
      <div className="relative flex-1">
        {/* Cámara */}
        <div className="absolute inset-0 z-0">
          <CameraView onFrame={processFrame} isActive={isStarted} />
        </div>

        {/* Gradiente */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50 z-10" />

        {/* Contenido principal */}
        <div className="absolute inset-0 z-20">
          <div className="h-full relative">
            {/* Vista del Monitor */}
            <div 
              className={`absolute inset-0 transform transition-transform duration-300 ease-out ${
                currentView === 'monitor' ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="h-full p-3 flex flex-col">
                {/* Parte superior con indicadores */}
                <div className="space-y-2 mb-3">
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

                {/* Signos vitales y gráfico */}
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="bg-black/30 backdrop-blur-md rounded-lg p-2.5 border border-white/10 mb-3">
                    <VitalSignsDisplay
                      bpm={bpm}
                      spo2={spo2}
                      systolic={systolic}
                      diastolic={diastolic}
                      hasArrhythmia={hasArrhythmia}
                      arrhythmiaType={arrhythmiaType}
                    />
                  </div>

                  {/* Gráfico PPG con espacio garantizado */}
                  <div className="flex-1 mb-24">
                    <div className="bg-black/30 backdrop-blur-md rounded-lg p-2 border border-white/10">
                      <h3 className="text-xs font-medium mb-1 text-gray-100">PPG en Tiempo Real</h3>
                      <div className="h-[100px]">
                        <VitalChart data={readings} color="#ea384c" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Vista de Calibración */}
            <div 
              className={`absolute inset-0 transform transition-transform duration-300 ease-out ${
                currentView === 'calibration' ? 'translate-x-0' : 'translate-x-full'
              }`}
            >
              <div className="min-h-full">
                <div className="pt-4 pb-32">
                  <CalibrationPanel 
                    settings={sensitivitySettings}
                    onUpdateSettings={updateSensitivitySettings}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Controles fijos en la parte inferior */}
        <div className="fixed bottom-6 left-0 right-0 px-4 z-30">
          <div className="flex gap-2 justify-center mb-4">
            <Button
              variant={currentView === 'monitor' ? 'default' : 'secondary'}
              className="h-8 flex-1 max-w-32 text-sm"
              onClick={() => handleViewChange('monitor')}
            >
              Monitor
            </Button>
            <Button
              variant={currentView === 'calibration' ? 'default' : 'secondary'}
              className="h-8 flex-1 max-w-32 gap-2 text-sm"
              onClick={() => handleViewChange('calibration')}
            >
              <Settings className="w-3.5 h-3.5" />
              Calibración
            </Button>
          </div>

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
  );
};

export default HeartRateMonitor;
