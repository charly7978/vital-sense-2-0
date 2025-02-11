
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import SensitivityControls from './SensitivityControls';
import CalibrationPanel from './CalibrationPanel';
import BPCalibrationForm from './BPCalibrationForm';
import VitalSignsDisplay from './vitals/VitalSignsDisplay';
import SignalQualityIndicator from './vitals/SignalQualityIndicator';
import MeasurementControls from './vitals/MeasurementControls';
import { PPGProcessor } from '../utils/ppgProcessor';
import { useVitals } from '@/contexts/VitalsContext';
import type { SensitivitySettings } from '../utils/types';

const ppgProcessor = new PPGProcessor();

const defaultSensitivitySettings = {
  signalAmplification: 1,
  noiseReduction: 1,
  peakDetection: 1
};

const defaultCalibrationSettings = {
  measurementDuration: {
    value: 30,
    min: 10,
    max: 60,
    step: 5,
    description: "Duración de la medición en segundos. Aumentar para mayor precisión, disminuir para respuesta más rápida."
  },
  minFramesForCalculation: {
    value: 30,
    min: 10,
    max: 100,
    step: 5,
    description: "Cantidad mínima de frames para iniciar cálculos. Aumentar para mayor estabilidad."
  },
  minPeaksForValidHR: {
    value: 3,
    min: 2,
    max: 10,
    step: 1,
    description: "Picos mínimos necesarios para calcular frecuencia cardíaca válida."
  },
  minPeakDistance: {
    value: 500,
    min: 200,
    max: 1000,
    step: 50,
    description: "Distancia mínima entre picos en ms. Ajustar según frecuencia cardíaca esperada."
  },
  maxPeakDistance: {
    value: 1500,
    min: 1000,
    max: 2000,
    step: 50,
    description: "Distancia máxima entre picos en ms. Ajustar según frecuencia cardíaca esperada."
  },
  peakThresholdFactor: {
    value: 0.5,
    min: 0.1,
    max: 1.0,
    step: 0.1,
    description: "Factor de umbral para detección de picos. Mayor valor = detección más estricta."
  },
  minRedValue: {
    value: 20,
    min: 0,
    max: 100,
    step: 1,
    description: "Valor mínimo de componente rojo para detectar dedo."
  },
  minRedDominance: {
    value: 1.5,
    min: 1.0,
    max: 3.0,
    step: 0.1,
    description: "Dominancia mínima del canal rojo sobre otros canales."
  },
  minValidPixelsRatio: {
    value: 0.3,
    min: 0.1,
    max: 1.0,
    step: 0.1,
    description: "Ratio mínimo de píxeles válidos en el frame."
  },
  minBrightness: {
    value: 30,
    min: 0,
    max: 100,
    step: 5,
    description: "Brillo mínimo necesario para medición válida."
  },
  minValidReadings: {
    value: 10,
    min: 5,
    max: 30,
    step: 5,
    description: "Lecturas válidas mínimas para calcular métricas."
  },
  fingerDetectionDelay: {
    value: 1000,
    min: 500,
    max: 3000,
    step: 100,
    description: "Retraso en ms para confirmar detección del dedo."
  },
  minSpO2: {
    value: 80,
    min: 70,
    max: 100,
    step: 1,
    description: "SpO2 mínimo considerado válido."
  },
  qualityThreshold: {
    value: 0.3,
    min: 0,
    max: 1,
    step: 0.05,
    description: "Umbral de calidad mínima de la señal."
  },
  signalAmplification: {
    value: 1.2,
    min: 1,
    max: 5,
    step: 0.1,
    description: "Factor de amplificación de la señal PPG."
  },
  noiseReduction: {
    value: 1,
    min: 0,
    max: 5,
    step: 0.1,
    description: "Factor de reducción de ruido."
  }
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

  const handleCalibrationChange = (key: string, value: number) => {
    const newSettings = {
      ...sensitivitySettings,
      [key]: value
    };
    
    setSensitivitySettings(newSettings);
    ppgProcessor.updateSensitivitySettings(newSettings);
    
    toast({
      title: "Calibración actualizada",
      description: `${key} ajustado a ${value}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
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

      <div className="flex flex-col gap-4">
        {isStarted && (
          <SignalQualityIndicator
            isStarted={isStarted}
            measurementQuality={measurementQuality}
            measurementProgress={measurementProgress}
          />
        )}

        <SensitivityControls 
          settings={sensitivitySettings}
          onSettingsChange={handleSensitivityChange}
        />

        <BPCalibrationForm />

        <CalibrationPanel 
          settings={defaultCalibrationSettings}
          onSettingChange={handleCalibrationChange}
        />

        <MeasurementControls
          isStarted={isStarted}
          onToggleMeasurement={toggleMeasurement}
        />
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <CameraView onFrame={processFrame} isActive={isStarted} />
        {isStarted && bpm === 0 && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-300 text-sm text-center">
              No se detecta el dedo en la cámara. Por favor, coloque su dedo correctamente sobre el lente.
            </p>
          </div>
        )}
      </div>
      
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <h3 className="text-lg font-medium mb-4 text-gray-100">Señal PPG en Tiempo Real</h3>
        <VitalChart data={readings} color="#ea384c" />
      </div>
    </div>
  );
};

export default HeartRateMonitor;

