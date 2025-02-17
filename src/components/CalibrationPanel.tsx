
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Gauge, Scale, Sparkles } from 'lucide-react';
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

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <Card className="bg-black/30 backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Panel de Calibración</CardTitle>
          <CardDescription className="text-gray-400">
            Ajusta los parámetros de sensibilidad para optimizar la detección
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {/* Amplificación de Señal */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-medium text-white">
                    Amplificación de Señal
                  </label>
                </div>
                <span className="text-xs text-gray-400">
                  {settings.signalAmplification.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[settings.signalAmplification]}
                min={1}
                max={3}
                step={0.1}
                onValueChange={handleSettingChange('signalAmplification')}
                className="[&_[role=slider]]:bg-purple-400"
              />
              <p className="mt-1 text-xs text-gray-500">
                Controla la intensidad de la señal PPG
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
                  {settings.noiseReduction.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[settings.noiseReduction]}
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
                  {settings.peakDetection.toFixed(2)}x
                </span>
              </div>
              <Slider
                value={[settings.peakDetection]}
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
