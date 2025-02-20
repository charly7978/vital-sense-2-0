import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stethoscope } from 'lucide-react';
import type { BPCalibrationData } from '@/utils/types';

const BPCalibrationForm = () => {
  const [systolic, setSystolic] = useState<number>(120);
  const [diastolic, setDiastolic] = useState<number>(80);
  const [age, setAge] = useState<number>(30);
  const [weight, setWeight] = useState<number>(70);
  const [height, setHeight] = useState<number>(170);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const calibrationData: BPCalibrationData = {
        calibration_type: 'blood_pressure',
        calibration_values: {
          systolic_reference: systolic,
          diastolic_reference: diastolic,
        },
        environmental_data: {
          timestamp: new Date().toISOString(),
          device_type: navigator.userAgent,
        },
        reference_measurements: {
          age,
          weight,
          height,
          notes,
        },
        is_active: true
      };

      const { error } = await supabase
        .from('unified_calibration')
        .insert([calibrationData]);

      if (error) throw error;

      toast({
        title: "Calibración guardada",
        description: "Los valores de referencia han sido guardados exitosamente.",
      });

    } catch (error) {
      console.error('Error al guardar calibración:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo guardar la calibración. Por favor intente nuevamente.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-xl mx-auto bg-black/30 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <Stethoscope className="w-6 h-6 text-blue-400" />
          <CardTitle>Calibración de Presión Arterial</CardTitle>
        </div>
        <CardDescription>
          Ingrese los valores de referencia medidos con un tensiómetro certificado
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systolic">Sistólica (mmHg)</Label>
              <Input
                id="systolic"
                type="number"
                min={70}
                max={200}
                value={systolic}
                onChange={(e) => setSystolic(Number(e.target.value))}
                required
                className="bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diastolic">Diastólica (mmHg)</Label>
              <Input
                id="diastolic"
                type="number"
                min={40}
                max={130}
                value={diastolic}
                onChange={(e) => setDiastolic(Number(e.target.value))}
                required
                className="bg-white/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                type="number"
                min={1}
                max={120}
                value={age}
                onChange={(e) => setAge(Number(e.target.value))}
                className="bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input
                id="weight"
                type="number"
                min={20}
                max={200}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="bg-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                type="number"
                min={100}
                max={250}
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="bg-white/10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas adicionales</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej: Medido después de 5 min de reposo"
              className="bg-white/10"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Guardando..." : "Guardar Calibración"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default BPCalibrationForm;
