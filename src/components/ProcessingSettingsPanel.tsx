
import React from 'react';
import { Settings2 } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ProcessingSettings } from '@/utils/types';

interface ProcessingSettingsPanelProps {
  settings: ProcessingSettings;
}

const ProcessingSettingsPanel: React.FC<ProcessingSettingsPanelProps> = ({
  settings
}) => {
  const settingsDisplay = [
    { key: 'MEASUREMENT_DURATION', label: 'Duración de la Medición (s)', unit: 's' },
    { key: 'MIN_FRAMES_FOR_CALCULATION', label: 'Mínimo de Frames', unit: 'frames' },
    { key: 'MIN_PEAKS_FOR_VALID_HR', label: 'Mínimo de Picos para HR Válido', unit: 'picos' },
    { key: 'MIN_PEAK_DISTANCE', label: 'Distancia Mínima entre Picos', unit: 'ms' },
    { key: 'MAX_PEAK_DISTANCE', label: 'Distancia Máxima entre Picos', unit: 'ms' },
    { key: 'PEAK_THRESHOLD_FACTOR', label: 'Factor de Umbral de Picos', unit: '' },
    { key: 'MIN_RED_VALUE', label: 'Valor Mínimo de Rojo', unit: '' },
    { key: 'MIN_RED_DOMINANCE', label: 'Dominancia Mínima de Rojo', unit: '' },
    { key: 'MIN_VALID_PIXELS_RATIO', label: 'Ratio Mínimo de Píxeles Válidos', unit: '' },
    { key: 'MIN_BRIGHTNESS', label: 'Brillo Mínimo', unit: '' },
    { key: 'MIN_VALID_READINGS', label: 'Lecturas Válidas Mínimas', unit: '' },
    { key: 'FINGER_DETECTION_DELAY', label: 'Retraso Detección de Dedo', unit: 'ms' },
    { key: 'MIN_SPO2', label: 'SpO2 Mínimo', unit: '%' }
  ];

  return (
    <Card className="w-full bg-black/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Settings2 className="w-6 h-6 text-gray-400" />
          <CardTitle className="text-xl font-semibold text-gray-100">
            Configuración de Procesamiento
          </CardTitle>
        </div>
        <CardDescription className="text-gray-400">
          Parámetros actuales de procesamiento de señal PPG
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsDisplay.map(({ key, label, unit }) => (
            <div key={key} className="bg-black/20 p-3 rounded-lg">
              <div className="text-sm text-gray-400">{label}</div>
              <div className="flex items-baseline space-x-2">
                <span className="text-xl font-semibold text-gray-100">
                  {(settings as any)[key]}
                </span>
                {unit && <span className="text-xs text-gray-400">{unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingSettingsPanel;
