
import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import type { CalibrationData } from '@/utils/types';

interface CalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: CalibrationData) => void;
}

const CalibrationDialog: React.FC<CalibrationDialogProps> = ({
  open,
  onOpenChange,
  onComplete
}) => {
  const [formData, setFormData] = useState<CalibrationData>({
    age: 0,
    height: 0,
    weight: 0,
    systolic: 0,
    diastolic: 0,
    deviceType: '',
    calibrationDate: new Date()
  });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.age || !formData.height || !formData.weight || 
        !formData.systolic || !formData.diastolic || !formData.deviceType) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "Por favor complete todos los campos"
      });
      return;
    }

    // Validate ranges
    if (formData.age < 18 || formData.age > 120) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La edad debe estar entre 18 y 120 años"
      });
      return;
    }

    if (formData.height < 100 || formData.height > 250) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La altura debe estar entre 100 y 250 cm"
      });
      return;
    }

    if (formData.weight < 30 || formData.weight > 300) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "El peso debe estar entre 30 y 300 kg"
      });
      return;
    }

    if (formData.systolic < 70 || formData.systolic > 200) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La presión sistólica debe estar entre 70 y 200 mmHg"
      });
      return;
    }

    if (formData.diastolic < 40 || formData.diastolic > 130) {
      toast({
        variant: "destructive",
        title: "Error de validación",
        description: "La presión diastólica debe estar entre 40 y 130 mmHg"
      });
      return;
    }

    onComplete(formData);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'deviceType' ? value : Number(value)
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-950 text-white">
        <DialogHeader>
          <DialogTitle>Calibración del Sistema</DialogTitle>
          <DialogDescription className="text-gray-400">
            Ingrese sus datos y mediciones de referencia para mejorar la precisión
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="age">Edad</Label>
              <Input
                id="age"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                className="bg-zinc-900"
                min="18"
                max="120"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input
                id="height"
                name="height"
                type="number"
                value={formData.height}
                onChange={handleInputChange}
                className="bg-zinc-900"
                min="100"
                max="250"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight">Peso (kg)</Label>
            <Input
              id="weight"
              name="weight"
              type="number"
              value={formData.weight}
              onChange={handleInputChange}
              className="bg-zinc-900"
              min="30"
              max="300"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systolic">Presión Sistólica</Label>
              <Input
                id="systolic"
                name="systolic"
                type="number"
                value={formData.systolic}
                onChange={handleInputChange}
                className="bg-zinc-900"
                min="70"
                max="200"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diastolic">Presión Diastólica</Label>
              <Input
                id="diastolic"
                name="diastolic"
                type="number"
                value={formData.diastolic}
                onChange={handleInputChange}
                className="bg-zinc-900"
                min="40"
                max="130"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="deviceType">Dispositivo de Referencia</Label>
            <Input
              id="deviceType"
              name="deviceType"
              type="text"
              value={formData.deviceType}
              onChange={handleInputChange}
              placeholder="Ej: Omron M3"
              className="bg-zinc-900"
            />
          </div>

          <Button type="submit" className="w-full">
            Guardar Calibración
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CalibrationDialog;

