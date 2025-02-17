
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Gauge, Scale, Sparkles, Heart, Zap, Activity, Sun } from 'lucide-react';
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
    <div className="max-w-md mx-auto space-y-4">
      <Card className="bg-black/30 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Panel de Calibración</CardTitle>
          <CardDescription className="text-gray-400">
            Ajusta los parámetros de sensibilidad para optimizar la detección
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Brillo */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4 text-yellow-400" />
                  <label className="text-sm font-medium text-white">
                    Brillo
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('brightness').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('brightness')]}
                min={0.1}
                max={2}
                step={0.1}
                onValueChange={handleSettingChange('brightness')}
                className="[&_[role=slider]]:bg-yellow-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ajusta el brillo de la imagen capturada
              </p>
            </div>

            {/* Reducción de Ruido */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  <label className="text-sm font-medium text-white">
                    Reducción de Ruido
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('noiseReduction').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('noiseReduction')]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={handleSettingChange('noiseReduction')}
                className="[&_[role=slider]]:bg-blue-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ajusta el nivel de filtrado de ruido
              </p>
            </div>

            {/* Sensibilidad de Detección */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Scale className="w-4 h-4 text-green-400" />
                  <label className="text-sm font-medium text-white">
                    Sensibilidad de Detección
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('peakDetection').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('peakDetection')]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={handleSettingChange('peakDetection')}
                className="[&_[role=slider]]:bg-green-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Controla la precisión en la detección de picos
              </p>
            </div>

            {/* Umbral de Latidos */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <label className="text-sm font-medium text-white">
                    Umbral de Latidos
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('heartbeatThreshold').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('heartbeatThreshold')]}
                min={0.1}
                max={1}
                step={0.05}
                onValueChange={handleSettingChange('heartbeatThreshold')}
                className="[&_[role=slider]]:bg-red-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ajusta la sensibilidad para detectar latidos
              </p>
            </div>

            {/* Tiempo de Respuesta */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  <label className="text-sm font-medium text-white">
                    Tiempo de Respuesta
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('responseTime').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('responseTime')]}
                min={0.5}
                max={2}
                step={0.1}
                onValueChange={handleSettingChange('responseTime')}
                className="[&_[role=slider]]:bg-yellow-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Controla la velocidad de respuesta del sensor
              </p>
            </div>

            {/* Estabilidad de Señal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-orange-400" />
                  <label className="text-sm font-medium text-white">
                    Estabilidad de Señal
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {getValue('signalStability').toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[getValue('signalStability')]}
                min={0.1}
                max={1}
                step={0.05}
                onValueChange={handleSettingChange('signalStability')}
                className="[&_[role=slider]]:bg-orange-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Ajusta la estabilidad de la señal capturada
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalibrationPanel;
