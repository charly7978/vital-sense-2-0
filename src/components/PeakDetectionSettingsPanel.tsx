
import React from 'react';
import { Card } from "@/components/ui/card";
import { Settings } from 'lucide-react';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface PeakDetectionSetting {
  id: string;
  name: string;
  value: number;
  description: string;
}

export const PeakDetectionSettingsPanel = () => {
  const [settings, setSettings] = React.useState<PeakDetectionSetting[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();

  React.useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('peak_detection_settings')
        .select('*')
        .limit(1)
        .single();

      if (error) throw error;

      if (data) {
        const settingsArray = Object.entries(data).map(([key, value]) => ({
          id: key,
          name: key.replace(/_/g, ' '),
          value: typeof value === 'number' ? value : 0,
          description: getDescriptionForSetting(key)
        })).filter(setting => 
          setting.id !== 'id' && 
          setting.id !== 'created_at' && 
          setting.id !== 'updated_at'
        );

        setSettings(settingsArray);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la configuración",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = async (id: string, value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;

    try {
      const { error } = await supabase
        .from('peak_detection_settings')
        .update({ [id]: numValue })
        .eq('id', 1);

      if (error) throw error;

      setSettings(prev => 
        prev.map(setting => 
          setting.id === id ? { ...setting, value: numValue } : setting
        )
      );

      toast({
        title: "Configuración actualizada",
        description: `${id.replace(/_/g, ' ')} se actualizó a ${numValue}`,
      });
    } catch (error) {
      console.error('Error actualizando configuración:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la configuración",
        variant: "destructive"
      });
    }
  };

  const getDescriptionForSetting = (key: string): string => {
    const descriptions: Record<string, string> = {
      min_distance: 'Distancia mínima entre picos (ms)',
      buffer_size: 'Tamaño del buffer de señal',
      min_amplitude: 'Amplitud mínima para considerar un pico',
      max_bpm: 'Máximo BPM permitido',
      min_bpm: 'Mínimo BPM permitido',
      peak_memory: 'Número de picos a recordar',
      measurement_duration: 'Duración de la medición (ms)',
      min_frames_for_calculation: 'Mínimo de frames necesarios',
      min_peaks_for_valid_hr: 'Mínimo de picos para HR válido',
      max_peak_distance: 'Distancia máxima entre picos (ms)',
      peak_threshold_factor: 'Factor para el umbral de picos',
      min_red_value: 'Valor mínimo del canal rojo',
      min_red_dominance: 'Dominancia mínima del rojo',
      min_valid_pixels_ratio: 'Ratio mínimo de píxeles válidos',
      min_brightness: 'Brillo mínimo requerido',
      min_valid_readings: 'Lecturas mínimas válidas',
      finger_detection_delay: 'Retraso detección dedo (ms)',
      min_spo2: 'SpO2 mínimo permitido'
    };
    return descriptions[key] || 'Sin descripción disponible';
  };

  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Settings className="w-5 h-5 text-gray-400 animate-spin" />
          <span>Cargando configuración...</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-black/20 backdrop-blur-sm">
      <div className="flex items-center space-x-2 mb-6">
        <Settings className="w-6 h-6 text-blue-500" />
        <h2 className="text-xl font-semibold">Configuración de Detección de Picos</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting) => (
          <div key={setting.id} className="space-y-2">
            <Label htmlFor={setting.id} className="font-medium">
              {setting.name}
              <span className="block text-sm text-gray-400">{setting.description}</span>
            </Label>
            <div className="flex gap-2">
              <Input
                id={setting.id}
                type="number"
                value={setting.value}
                onChange={(e) => handleSettingChange(setting.id, e.target.value)}
                className="bg-black/10"
                step="any"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <Button 
          onClick={loadSettings}
          variant="outline"
          className="w-full"
        >
          Recargar Configuración
        </Button>
      </div>
    </Card>
  );
};
