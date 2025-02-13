
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCalibration } from '@/hooks/useCalibration';
import { Card } from "@/components/ui/card";
import { getAllCalibrationInfo, setCalibrationValue } from '@/utils/calibrationSettings';
import { Slider } from "@/components/ui/slider";

export const CalibrationProfilesManager = () => {
  const { isLoading, profiles, activeProfile, saveProfile, activateProfile } = useCalibration();
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');
  const allSettings = getAllCalibrationInfo();

  const handleSaveProfile = async () => {
    if (!newProfileName.trim()) return;
    await saveProfile(newProfileName, newProfileDescription);
    setNewProfileName('');
    setNewProfileDescription('');
  };

  const handleValueChange = (key: string, value: number[]) => {
    setCalibrationValue(key as any, value[0]);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Calibración del Sistema</h2>
        
        {/* Ajustes de calibración actuales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allSettings.map((setting) => (
            <Card key={setting.key} className="p-4 space-y-2">
              <Label htmlFor={setting.key} className="font-medium">
                {setting.key}
              </Label>
              <p className="text-sm text-gray-500">{setting.description}</p>
              
              {/* Mostrar componentes afectados si existen */}
              {'affects' in setting && Array.isArray(setting.affects) && setting.affects.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium text-gray-600">Afecta a:</p>
                  <ul className="text-sm text-gray-500 list-disc pl-4">
                    {setting.affects.map((affect: string, index: number) => (
                      <li key={index}>{affect}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex items-center gap-2 mt-2">
                <Slider
                  id={setting.key}
                  min={setting.min}
                  max={setting.max}
                  step={setting.step}
                  value={[setting.value]}
                  onValueChange={(value) => handleValueChange(setting.key, value)}
                />
                <span className="min-w-[4rem] text-right">{setting.value}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Guardar nuevo perfil */}
        <Card className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Guardar Perfil Actual</h3>
          <div className="space-y-2">
            <Label htmlFor="profileName">Nombre del Perfil</Label>
            <Input
              id="profileName"
              value={newProfileName}
              onChange={(e) => setNewProfileName(e.target.value)}
              placeholder="Ej: Calibración Óptima"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="profileDescription">Descripción</Label>
            <Textarea
              id="profileDescription"
              value={newProfileDescription}
              onChange={(e) => setNewProfileDescription(e.target.value)}
              placeholder="Describe las características de esta calibración..."
            />
          </div>
          <Button 
            onClick={handleSaveProfile} 
            disabled={isLoading || !newProfileName.trim()}
          >
            Guardar Perfil
          </Button>
        </Card>

        {/* Lista de perfiles guardados */}
        <Card className="p-4 space-y-4">
          <h3 className="text-lg font-semibold">Perfiles Guardados</h3>
          <div className="space-y-2">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="flex items-center justify-between p-2 border rounded"
              >
                <div>
                  <h4 className="font-medium">{profile.name}</h4>
                  {profile.description && (
                    <p className="text-sm text-gray-500">{profile.description}</p>
                  )}
                </div>
                <Button
                  variant={profile.id === activeProfile ? "default" : "outline"}
                  onClick={() => activateProfile(profile.id)}
                  disabled={isLoading}
                >
                  {profile.id === activeProfile ? "Activo" : "Activar"}
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};
