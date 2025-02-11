
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { 
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle 
} from "@/components/ui/card";
import { Settings2 } from 'lucide-react';
import type { CalibrationSettings } from '@/utils/types';

interface CalibrationPanelProps {
  settings: CalibrationSettings;
  onSettingChange: (key: string, value: number) => void;
}

const defaultSettings: CalibrationSettings = {
  minRedValue: {
    value: 20,
    min: 0,
    max: 100,
    step: 1,
    description: "Valor mínimo de componente rojo para detectar presencia del dedo. Aumentar si hay falsos positivos, disminuir si no detecta el dedo."
  },
  qualityThreshold: {
    value: 0.3,
    min: 0,
    max: 1,
    step: 0.05,
    description: "Umbral de calidad mínima de la señal. Aumentar para mayor precisión pero menor sensibilidad."
  },
  signalAmplification: {
    value: 1.2,
    min: 1,
    max: 5,
    step: 0.1,
    description: "Factor de amplificación de la señal PPG. Aumentar para señales débiles, disminuir si hay saturación."
  },
  noiseReduction: {
    value: 1,
    min: 0,
    max: 5,
    step: 0.1,
    description: "Factor de reducción de ruido. Aumentar para señales ruidosas, disminuir si se pierde detalle."
  },
  samplingRate: {
    value: 30,
    min: 15,
    max: 60,
    step: 5,
    description: "Frecuencia de muestreo en Hz. Aumentar para mayor precisión, disminuir si hay lag."
  },
  windowSize: {
    value: 300,
    min: 100,
    max: 1000,
    step: 50,
    description: "Tamaño de la ventana de análisis en muestras. Aumentar para mayor estabilidad, disminuir para respuesta más rápida."
  },
  peakThreshold: {
    value: 0.5,
    min: 0.1,
    max: 1,
    step: 0.05,
    description: "Umbral para detección de picos. Aumentar si detecta falsos picos, disminuir si pierde picos reales."
  },
  kalmanQ: {
    value: 0.1,
    min: 0.01,
    max: 1,
    step: 0.01,
    description: "Ruido del proceso en filtro Kalman. Aumentar para seguimiento más rápido, disminuir para mayor estabilidad."
  },
  kalmanR: {
    value: 1,
    min: 0.1,
    max: 10,
    step: 0.1,
    description: "Ruido de medición en filtro Kalman. Aumentar para señales ruidosas, disminuir para señales limpias."
  }
};

const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  settings = defaultSettings,
  onSettingChange
}) => {
  return (
    <Card className="w-full bg-black/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Settings2 className="w-6 h-6 text-gray-400" />
          <CardTitle className="text-xl font-semibold text-gray-100">
            Panel de Calibración
          </CardTitle>
        </div>
        <CardDescription className="text-gray-400">
          Ajusta los parámetros de calibración para optimizar las mediciones
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {Object.entries(settings).map(([key, setting]) => (
          <div key={key} className="space-y-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <Label htmlFor={key} className="text-sm font-medium text-gray-200">
                  {key}
                </Label>
                <p className="text-xs text-gray-400">{setting.description}</p>
              </div>
              <span className="text-sm text-gray-300">
                {setting.value.toFixed(2)}
              </span>
            </div>
            <Slider
              id={key}
              min={setting.min}
              max={setting.max}
              step={setting.step}
              value={[setting.value]}
              onValueChange={(value) => onSettingChange(key, value[0])}
              className="w-full"
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default CalibrationPanel;
