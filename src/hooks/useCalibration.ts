
import { useState, useEffect } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { toast } from '@/hooks/use-toast';
import { getAllCalibrationInfo, setCalibrationValue } from '@/utils/calibrationSettings';

export const useCalibration = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [activeProfile, setActiveProfile] = useState<string | null>(null);

  const loadProfiles = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('calibration_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setProfiles(data || []);
      
      // Cargar perfil activo si existe
      const activeProfileData = data?.find(p => p.is_active);
      if (activeProfileData && typeof activeProfileData.settings === 'object') {
        setActiveProfile(activeProfileData.id);
        applyCalibrationProfile(activeProfileData.settings as Record<string, number>);
      }
    } catch (error) {
      console.error('Error cargando perfiles:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los perfiles de calibración",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async (name: string, description?: string) => {
    try {
      setIsLoading(true);
      const currentSettings = getAllCalibrationInfo().reduce((acc, setting) => ({
        ...acc,
        [setting.key]: setting.value
      }), {});

      const { data, error } = await supabase
        .from('calibration_profiles')
        .insert([
          {
            name,
            description,
            settings: currentSettings,
            device_info: {
              userAgent: navigator.userAgent,
              platform: navigator.platform
            },
            environment_conditions: {
              timestamp: new Date().toISOString(),
              type: 'manual_calibration'
            }
          }
        ])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Éxito",
        description: "Perfil de calibración guardado correctamente"
      });

      await loadProfiles();
      return data;
    } catch (error) {
      console.error('Error guardando perfil:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el perfil de calibración",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const activateProfile = async (profileId: string) => {
    try {
      setIsLoading(true);
      
      // Desactivar todos los perfiles
      await supabase
        .from('calibration_profiles')
        .update({ is_active: false })
        .neq('id', profileId);

      // Activar el perfil seleccionado
      const { data, error } = await supabase
        .from('calibration_profiles')
        .update({ is_active: true })
        .eq('id', profileId)
        .select()
        .single();

      if (error) throw error;

      if (data && typeof data.settings === 'object') {
        setActiveProfile(profileId);
        applyCalibrationProfile(data.settings as Record<string, number>);
      }

      toast({
        title: "Éxito",
        description: "Perfil de calibración activado correctamente"
      });

      await loadProfiles();
    } catch (error) {
      console.error('Error activando perfil:', error);
      toast({
        title: "Error",
        description: "No se pudo activar el perfil de calibración",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyCalibrationProfile = (settings: Record<string, number>) => {
    Object.entries(settings).forEach(([key, value]) => {
      setCalibrationValue(key as any, value);
    });
  };

  useEffect(() => {
    loadProfiles();
  }, []);

  return {
    isLoading,
    profiles,
    activeProfile,
    saveProfile,
    activateProfile,
    loadProfiles
  };
};
