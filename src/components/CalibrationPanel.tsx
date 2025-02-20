
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
            {/* Amplificación de Señal */}
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
              <p className="text-xs text-gray-400 mt-2">
                Aumenta o disminuye la intensidad general de la señal PPG.
                <br />
                ↑ Mayor valor: Mejora detección en señales débiles, pero puede saturarse
                <br />
                ↓ Menor valor: Reduce saturación, mejor para señales fuertes
              </p>
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
              <p className="text-xs text-gray-400 mt-2">
                Define qué tan pronunciado debe ser un pico para considerarse pulso.
                <br />
                ↑ Mayor valor: Detecta solo picos muy pronunciados, más preciso pero puede perder pulsos
                <br />
                ↓ Menor valor: Detecta picos más sutiles, mejor para pulsos débiles pero puede dar falsos positivos
              </p>
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
              <p className="text-xs text-gray-400 mt-2">
                Ajusta la sensibilidad para diferenciar picos reales de ruido.
                <br />
                ↑ Mayor valor: Más estricto, solo detecta picos muy claros, reduce falsos positivos
                <br />
                ↓ Menor valor: Más permisivo, detecta picos más sutiles, útil en señales débiles
              </p>
            </div>

            {/* Filtro de Ruido */}
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
              <p className="text-xs text-gray-400 mt-2">
                Controla la intensidad del filtrado de ruido en la señal.
                <br />
                ↑ Mayor valor: Señal más suave, elimina más ruido pero puede perder detalles
                <br />
                ↓ Menor valor: Señal más cruda, mantiene más detalles pero con más ruido
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalibrationPanel;
