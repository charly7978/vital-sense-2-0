
import React, { useState } from 'react';
import { Settings2, Save } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { ProcessingSettings } from '@/utils/types';

interface ProcessingSettingsPanelProps {
  settings: ProcessingSettings;
  onSettingsChange?: (newSettings: ProcessingSettings) => void;
}

const ProcessingSettingsPanel: React.FC<ProcessingSettingsPanelProps> = ({
  settings,
  onSettingsChange
}) => {
  const [editedSettings, setEditedSettings] = useState<ProcessingSettings>({...settings});
  const { toast } = useToast();

  const settingsDisplay = [
    { key: 'MEASUREMENT_DURATION', label: 'Duración de la Medición (s)', unit: 's', min: 10, max: 120 },
    { key: 'MIN_FRAMES_FOR_CALCULATION', label: 'Mínimo de Frames', unit: 'frames', min: 10, max: 100 },
    { key: 'MIN_PEAKS_FOR_VALID_HR', label: 'Mínimo de Picos para HR Válido', unit: 'picos', min: 1, max: 10 },
    { key: 'MIN_PEAK_DISTANCE', label: 'Distancia Mínima entre Picos', unit: 'ms', min: 300, max: 1000 },
    { key: 'MAX_PEAK_DISTANCE', label: 'Distancia Máxima entre Picos', unit: 'ms', min: 1000, max: 2000 },
    { key: 'PEAK_THRESHOLD_FACTOR', label: 'Factor de Umbral de Picos', unit: '', min: 0.1, max: 1 },
    { key: 'MIN_RED_VALUE', label: 'Valor Mínimo de Rojo', unit: '', min: 10, max: 100 },
    { key: 'MIN_RED_DOMINANCE', label: 'Dominancia Mínima de Rojo', unit: '', min: 1, max: 3 },
    { key: 'MIN_VALID_PIXELS_RATIO', label: 'Ratio Mínimo de Píxeles Válidos', unit: '', min: 0.1, max: 1 },
    { key: 'MIN_BRIGHTNESS', label: 'Brillo Mínimo', unit: '', min: 50, max: 200 },
    { key: 'MIN_VALID_READINGS', label: 'Lecturas Válidas Mínimas', unit: '', min: 10, max: 100 },
    { key: 'FINGER_DETECTION_DELAY', label: 'Retraso Detección de Dedo', unit: 'ms', min: 500, max: 2000 },
    { key: 'MIN_SPO2', label: 'SpO2 Mínimo', unit: '%', min: 70, max: 100 }
  ];

  const handleChange = (key: keyof ProcessingSettings, value: string) => {
    const numValue = parseFloat(value);
    const setting = settingsDisplay.find(s => s.key === key);
    
    if (setting && numValue >= setting.min && numValue <= setting.max) {
      setEditedSettings(prev => ({
        ...prev,
        [key]: numValue
      }));
    }
  };

  const handleSave = () => {
    if (onSettingsChange) {
      onSettingsChange(editedSettings);
      toast({
        title: "Configuración actualizada",
        description: "Los nuevos parámetros han sido guardados exitosamente."
      });
    }
  };

  return (
    <Card className="w-full bg-black/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Settings2 className="w-6 h-6 text-gray-400" />
            <CardTitle className="text-xl font-semibold text-gray-100">
              Configuración de Procesamiento
            </CardTitle>
          </div>
          <Button 
            onClick={handleSave}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
        <CardDescription className="text-gray-400">
          Ajusta los parámetros de procesamiento de señal PPG
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {settingsDisplay.map(({ key, label, unit, min, max }) => (
            <div key={key} className="bg-black/20 p-3 rounded-lg">
              <div className="text-sm text-gray-400">{label}</div>
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={editedSettings[key as keyof ProcessingSettings]}
                  onChange={(e) => handleChange(key as keyof ProcessingSettings, e.target.value)}
                  min={min}
                  max={max}
                  step={key === 'PEAK_THRESHOLD_FACTOR' || key === 'MIN_VALID_PIXELS_RATIO' || key === 'MIN_RED_DOMINANCE' ? 0.1 : 1}
                  className="bg-black/20 border-gray-700 text-gray-100"
                />
                {unit && <span className="text-xs text-gray-400 w-8">{unit}</span>}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ProcessingSettingsPanel;
