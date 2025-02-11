
import React from 'react';
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import type { SensitivitySettings } from '@/utils/types';

interface SensitivityControlsProps {
  settings: SensitivitySettings;
  onSettingsChange: (settings: SensitivitySettings) => void;
}

const SensitivityControls: React.FC<SensitivityControlsProps> = ({
  settings,
  onSettingsChange
}) => {
  const handleChange = (value: number[], key: keyof SensitivitySettings) => {
    onSettingsChange({
      ...settings,
      [key]: value[0]
    });
  };

  return (
    <div className="space-y-6 bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
      <h3 className="text-lg font-medium text-gray-100 mb-4">Ajustes de Sensibilidad</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="amplification">Amplificación de Señal</Label>
            <span className="text-sm text-gray-400">{settings.signalAmplification}x</span>
          </div>
          <Slider
            id="amplification"
            min={1}
            max={10}
            step={0.1}
            value={[settings.signalAmplification]}
            onValueChange={(value) => handleChange(value, 'signalAmplification')}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="noise">Reducción de Ruido</Label>
            <span className="text-sm text-gray-400">{settings.noiseReduction}x</span>
          </div>
          <Slider
            id="noise"
            min={0}
            max={5}
            step={0.1}
            value={[settings.noiseReduction]}
            onValueChange={(value) => handleChange(value, 'noiseReduction')}
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="peaks">Sensibilidad de Detección de Picos</Label>
            <span className="text-sm text-gray-400">{settings.peakDetection}x</span>
          </div>
          <Slider
            id="peaks"
            min={0.1}
            max={2}
            step={0.1}
            value={[settings.peakDetection]}
            onValueChange={(value) => handleChange(value, 'peakDetection')}
          />
        </div>
      </div>
    </div>
  );
};

export default SensitivityControls;

