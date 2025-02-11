
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

interface CalibrationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onComplete: (data: CalibrationData) => void;
}

interface CalibrationData {
  age: number;
  height: number;
  weight: number;
  systolic: number;
  diastolic: number;
  deviceType: string;
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
    deviceType: ''
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
