
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Activity, Check } from 'lucide-react';
import { useVitals } from '@/contexts/VitalsContext';
import { useToast } from "@/hooks/use-toast";

const AutoCalibrationButton = () => {
  const [isCalibrating, setIsCalibrating] = useState(false);
  const { updateSensitivitySettings, measurementQuality, readings } = useVitals();
  const { toast } = useToast();

  const startAutoCalibration = async () => {
    setIsCalibrating(true);
    toast({
      title: "Iniciando calibración automática",
      description: "Por favor, mantenga su dedo quieto sobre la cámara."
    });

    // Análisis inicial de la señal
    const signalStrength = Math.max(...readings.slice(-30).map(r => r.value));
    const avgQuality = readings.slice(-30).reduce((sum, r) => sum + r.value, 0) / 30;
    
    // Ajustes automáticos basados en la calidad de la señal
    let newSettings = {
      signalAmplification: 1.8,
      noiseReduction: 1.2,
      peakDetection: 1.4,
      heartbeatThreshold: 0.4,
      responseTime: 1.0,
      signalStability: 0.5,
      brightness: 1.0,
      redIntensity: 1.0
    };

    // Ajuste de amplificación
    if (signalStrength < 50) {
      newSettings.signalAmplification = 2.2;
      newSettings.brightness = 1.2;
    } else if (signalStrength > 200) {
      newSettings.signalAmplification = 1.4;
      newSettings.brightness = 0.8;
    }

    // Ajuste de reducción de ruido
    if (measurementQuality < 0.3) {
      newSettings.noiseReduction = 1.4;
      newSettings.signalStability = 0.7;
    }

    // Ajuste de detección de picos
    if (avgQuality < 100) {
      newSettings.peakDetection = 1.6;
      newSettings.heartbeatThreshold = 0.3;
    }

    // Calibración en pasos
    const steps = [
      { setting: 'signalAmplification', values: [1.6, 1.8, 2.0] },
      { setting: 'noiseReduction', values: [1.0, 1.2, 1.4] },
      { setting: 'peakDetection', values: [1.2, 1.4, 1.6] }
    ];

    for (const step of steps) {
      for (const value of step.values) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        updateSensitivitySettings({ [step.setting]: value });
      }
    }

    // Aplicar configuración final optimizada
    updateSensitivitySettings(newSettings);

    setIsCalibrating(false);
    toast({
      title: "Calibración completada",
      description: "Los parámetros han sido ajustados automáticamente.",
    });
  };

  return (
    <Button
      onClick={startAutoCalibration}
      disabled={isCalibrating}
      variant="secondary"
      className="w-full flex items-center justify-center gap-2"
    >
      {isCalibrating ? (
        <>
          <Activity className="w-4 h-4 animate-pulse" />
          Calibrando...
        </>
      ) : (
        <>
          <Check className="w-4 h-4" />
          Calibración Automática
        </>
      )}
    </Button>
  );
};

export default AutoCalibrationButton;
