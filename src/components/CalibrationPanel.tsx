
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
            Ajustes técnicos del procesamiento de la señal fotopletismográfica
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
                    Ganancia del Sensor PPG
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
                Ajusta la ganancia del sensor óptico para la captura de señal PPG.
                <br />
                ↑ Alto (5.0): Máxima sensibilidad para captar señales muy débiles
                <br />
                ↓ Bajo (1.0): Evita saturación en señales fuertes y piel clara
              </p>
            </div>

            {/* Umbral de Detección */}
            <div className="bg-black/20 p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-red-400" />
                  <label className="text-sm font-medium text-white">
                    Umbral de Detección R-R
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
                Configura el umbral para detección de intervalos R-R en la señal PPG.
                <br />
                ↑ Alto (2.5): Mayor precisión, requiere señal fuerte y estable
                <br />
                ↓ Bajo (0.5): Mejor detección en señales débiles o irregulares
              </p>
            </div>

            {/* Sensibilidad de Picos */}
            <div className="bg-black/20 p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-green-400" />
                  <label className="text-sm font-medium text-white">
                    Discriminador de Impulsos
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
                Nivel de discriminación entre pulsos cardíacos y artefactos.
                <br />
                ↑ Alto (1.0): Máxima discriminación, elimina falsos positivos
                <br />
                ↓ Bajo (0.1): Mayor sensibilidad, útil en señales atenuadas
              </p>
            </div>

            {/* Filtro de Ruido */}
            <div className="bg-black/20 p-2 rounded-lg">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <Waves className="w-4 h-4 text-purple-400" />
                  <label className="text-sm font-medium text-white">
                    Filtro Digital PPG
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
                Filtrado digital de la señal PPG (paso bajo y banda).
                <br />
                ↑ Alto (2.5): Máxima limpieza, mejor para entornos ruidosos
                <br />
                ↓ Bajo (0.5): Mínimo procesamiento, preserva detalles de la onda
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CalibrationPanel;
