
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Heart, Target, Gauge, Waves } from 'lucide-react';
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
    <div className="max-w-3xl mx-auto mt-4">
      <Card className="bg-black/30 backdrop-blur-md border-white/10">
        <CardHeader className="pb-2">
          <CardTitle className="text-white text-lg">Calibración de Señal PPG</CardTitle>
          <CardDescription className="text-gray-400 text-sm">
            Ajuste la sensibilidad para una mejor detección del pulso
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 gap-3">
            {/* Sensibilidad de Señal PPG */}
            <div className="bg-black/20 p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-blue-400" />
                  <label className="text-sm font-medium text-white">
                    Amplificación de Señal PPG
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
            </div>

            {/* Umbral de Detección */}
            <div className="bg-black/20 p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <label className="text-sm font-medium text-white">
                    Umbral de Detección de Picos
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
            </div>

            {/* Sensibilidad de Picos */}
            <div className="bg-black/20 p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-green-400" />
                  <label className="text-sm font-medium text-white">
                    Sensibilidad de Picos
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
            </div>

            {/* Filtro de Ruido de Señal */}
            <div className="bg-black/20 p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-medium text-white">
                    Filtro de Ruido PPG
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
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalibrationPanel;
