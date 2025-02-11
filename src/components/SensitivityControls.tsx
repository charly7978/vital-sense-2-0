
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
  const handleChange = (value: number[]) => {
    onSettingsChange({
      ...settings,
      signalAmplification: value[0],
      noiseReduction: value[0] * 0.5,
      peakDetection: value[0] * 0.2
    });
  };

  return (
    <div className="space-y-6 bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
      <h3 className="text-lg font-medium text-gray-100 mb-4">Sensibilidad</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label htmlFor="sensitivity">Nivel de Sensibilidad</Label>
            <span className="text-sm text-gray-400">{settings.signalAmplification}x</span>
          </div>
          <Slider
            id="sensitivity"
            min={1}
            max={10}
            step={0.1}
            value={[settings.signalAmplification]}
            onValueChange={handleChange}
          />
        </div>
      </div>
    </div>
  );
};

export default SensitivityControls;
