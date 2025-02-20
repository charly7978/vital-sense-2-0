
import React from 'react';
import { useForm } from 'react-hook-form';
import { supabase } from '@/integrations/supabase/client';
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface CalibrationFormData {
  systolic: number;
  diastolic: number;
}

const BPCalibrationForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<CalibrationFormData>();
  const { toast } = useToast();

  const onSubmit = async (data: CalibrationFormData) => {
    try {
      const { error } = await supabase
        .from('user_calibration')
        .update({
          reference_bp_systolic: data.systolic,
          reference_bp_diastolic: data.diastolic,
          calibration_date: new Date().toISOString(),
        })
        .eq('is_active', true);

      if (error) throw error;

      toast({
        title: "Calibración exitosa",
        description: "Los valores de referencia han sido actualizados.",
      });
    } catch (error) {
      console.error('Error al calibrar:', error);
      toast({
        variant: "destructive",
        title: "Error en la calibración",
        description: "No se pudieron guardar los valores de referencia.",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">
          Presión Sistólica (mmHg)
        </label>
        <input
          type="number"
          {...register('systolic', { 
            required: true,
            min: 90,
            max: 180
          })}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.systolic && (
          <p className="text-xs text-red-500">
            Ingrese un valor entre 90 y 180 mmHg
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          Presión Diastólica (mmHg)
        </label>
        <input
          type="number"
          {...register('diastolic', { 
            required: true,
            min: 60,
            max: 120
          })}
          className="w-full px-3 py-2 border rounded-md"
        />
        {errors.diastolic && (
          <p className="text-xs text-red-500">
            Ingrese un valor entre 60 y 120 mmHg
          </p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Guardar Calibración
      </Button>
    </form>
  );
};

export default BPCalibrationForm;
