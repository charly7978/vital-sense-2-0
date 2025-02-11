
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import SensitivityControls from './SensitivityControls';
import BPCalibrationForm from './BPCalibrationForm';
import VitalSignsDisplay from './vitals/VitalSignsDisplay';
import SignalQualityIndicator from './vitals/SignalQualityIndicator';
import MeasurementControls from './vitals/MeasurementControls';
import ProcessingSettingsPanel from './ProcessingSettingsPanel';
import { PPGProcessor } from '../utils/ppgProcessor';
import { useVitals } from '@/contexts/VitalsContext';
import type { SensitivitySettings } from '../utils/types';

const ppgProcessor = new PPGProcessor();

const defaultSensitivitySettings = {
  signalAmplification: 1,
  noiseReduction: 1,
  peakDetection: 1
};

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

  const [sensitivitySettings, setSensitivitySettings] = useState<SensitivitySettings>(defaultSensitivitySettings);
  const { toast } = useToast();

  const handleSensitivityChange = (newSettings: SensitivitySettings) => {
    setSensitivitySettings(newSettings);
    ppgProcessor.updateSensitivitySettings(newSettings);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-100">Monitor de Signos Vitales</h2>
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
          <CameraView onFrame={processFrame} isActive={isStarted} />
          {isStarted && bpm === 0 && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-300 text-sm">
                No se detecta el dedo en la cámara. Por favor, coloque su dedo sobre el lente.
              </p>
            </div>
          )}
        </div>

        <ProcessingSettingsPanel settings={ppgProcessor.processingSettings} />
      </div>

      <div className="space-y-4">
        {isStarted && (
          <SignalQualityIndicator
            isStarted={isStarted}
            measurementQuality={measurementQuality}
            measurementProgress={measurementProgress}
          />
        )}

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
          <h3 className="text-lg font-medium mb-2 text-gray-100">Señal PPG en Tiempo Real</h3>
          <VitalChart data={readings} color="#ea384c" />
        </div>

        <div className="flex flex-col gap-2">
          <SensitivityControls 
            settings={sensitivitySettings}
            onSettingsChange={handleSensitivityChange}
          />

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
