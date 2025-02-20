
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Heart, Target, Zap, Gauge, Waves } from 'lucide-react';
import type { SensitivitySettings } from '@/utils/types';

interface CalibrationPanelProps {
  settings: SensitivitySettings;
  onUpdateSettings: (settings: SensitivitySettings) => void;
}

const CalibrationPanel: React.FC<CalibrationPanelProps> = ({
  settings,
  onUpdateSettings
}) => {
  const handleSettingChange = (key: keyof SensitivitySettings) => (value: number[]) => {
    onUpdateSettings({
      ...settings,
      [key]: value[0]
    });
  };

  const getValue = (key: keyof SensitivitySettings, defaultValue: number = 1) => {
    return settings[key] ?? defaultValue;
  };

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="bg-black/30 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Calibración de Captación de Pulso</CardTitle>
          <CardDescription className="text-gray-400">
            Ajuste los parámetros para optimizar la detección de latidos
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Sensibilidad de Captación */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  <label className="text-sm font-medium text-white">
                    Sensibilidad de Captación
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('signalAmplification').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('signalAmplification')]}
                min={1.0}
                max={5.0}
                step={0.1}
                onValueChange={handleSettingChange('signalAmplification')}
                className="[&_[role=slider]]:bg-blue-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ajusta la sensibilidad general del sensor
              </p>
            </div>

            {/* Precisión de Pulso */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <label className="text-sm font-medium text-white">
                    Precisión de Pulso
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('peakDetection').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('peakDetection')]}
                min={0.5}
                max={2.5}
                step={0.1}
                onValueChange={handleSettingChange('peakDetection')}
                className="[&_[role=slider]]:bg-red-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Controla la precisión en la detección de cada latido
              </p>
            </div>

            {/* Velocidad de Muestreo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <label className="text-sm font-medium text-white">
                    Velocidad de Muestreo
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('responseTime').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('responseTime')]}
                min={0.5}
                max={2.0}
                step={0.1}
                onValueChange={handleSettingChange('responseTime')}
                className="[&_[role=slider]]:bg-yellow-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ajusta la frecuencia de captación de datos
              </p>
            </div>

            {/* Intensidad Mínima */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-green-400" />
                  <label className="text-sm font-medium text-white">
                    Intensidad Mínima
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('heartbeatThreshold').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('heartbeatThreshold')]}
                min={0.1}
                max={1.0}
                step={0.05}
                onValueChange={handleSettingChange('heartbeatThreshold')}
                className="[&_[role=slider]]:bg-green-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Define el umbral mínimo para detectar un latido
              </p>
            </div>

            {/* Filtro de Ruido */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-medium text-white">
                    Filtro de Ruido
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('noiseReduction').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('noiseReduction')]}
                min={0.5}
                max={2.5}
                step={0.1}
                onValueChange={handleSettingChange('noiseReduction')}
                className="[&_[role=slider]]:bg-purple-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Reduce interferencias en la señal del pulso
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-xs text-gray-500">
          Los cambios se aplican automáticamente
        </p>
      </div>
    </div>
  );
};

export default CalibrationPanel;
