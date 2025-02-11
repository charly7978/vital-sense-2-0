import React, { useState, useCallback, useEffect } from 'react';
import { Heart, Droplets, Activity, AlertTriangle, PlayCircle, StopCircle, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import CalibrationDialog from './CalibrationDialog';
import { PPGProcessor } from '../utils/ppgProcessor';
import type { VitalReading } from '../utils/types';
import { supabase } from '@/integrations/supabase/client';

const ppgProcessor = new PPGProcessor();

const HeartRateMonitor: React.FC = () => {
  const [bpm, setBpm] = useState<number>(0);
  const [spo2, setSpo2] = useState<number>(0);
  const [systolic, setSystolic] = useState<number>(0);
  const [diastolic, setDiastolic] = useState<number>(0);
  const [hasArrhythmia, setHasArrhythmia] = useState<boolean>(false);
  const [arrhythmiaType, setArrhythmiaType] = useState<string>('Normal');
  const [readings, setReadings] = useState<VitalReading[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isStarted, setIsStarted] = useState<boolean>(false);
  const [showCalibration, setShowCalibration] = useState<boolean>(false);
  const [isCalibrated, setIsCalibrated] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    checkCalibration();
  }, []);

  const checkCalibration = async () => {
    try {
      const { data: calibrationData } = await supabase
        .from('user_calibration')
        .select('*')
        .limit(1);

      setIsCalibrated(!!calibrationData && calibrationData.length > 0);
    } catch (error) {
      console.error('Error checking calibration:', error);
    }
  };

  const handleFrame = useCallback((imageData: ImageData) => {
    if (!isStarted) return;
    
    setIsProcessing(true);
    try {
      const vitals = ppgProcessor.processFrame(imageData);
      if (vitals) {
        setBpm(vitals.bpm || 0);
        setSpo2(vitals.spo2 || 0);
        setSystolic(vitals.systolic || 0);
        setDiastolic(vitals.diastolic || 0);
        setHasArrhythmia(vitals.hasArrhythmia || false);
        setArrhythmiaType(vitals.arrhythmiaType || 'Normal');
        setReadings(ppgProcessor.getReadings());
      }
    } catch (error) {
      console.error('Error processing frame:', error);
      toast({
        variant: "destructive",
        title: "Error en el procesamiento",
        description: "Error al procesar la imagen de la cámara."
      });
    }
  }, [isStarted, toast]);

  const toggleMeasurement = () => {
    setIsStarted(!isStarted);
    if (!isStarted) {
      toast({
        title: "Iniciando medición",
        description: "Por favor, mantenga su dedo frente a la cámara."
      });
    } else {
      setIsProcessing(false);
    }
  };

  const handleCalibrationComplete = async (calibrationData: any) => {
    try {
      const { error } = await supabase
        .from('user_calibration')
        .insert({
          age: calibrationData.age,
          height: calibrationData.height,
          weight: calibrationData.weight,
          reference_bp_systolic: calibrationData.systolic,
          reference_bp_diastolic: calibrationData.diastolic,
          reference_device_type: calibrationData.deviceType,
          is_active: true
        });

      if (error) throw error;

      setIsCalibrated(true);
      setShowCalibration(false);
      toast({
        title: "Calibración completada",
        description: "Los datos de calibración se han guardado correctamente."
      });
    } catch (error) {
      console.error('Error saving calibration:', error);
      toast({
        variant: "destructive",
        title: "Error en la calibración",
        description: "No se pudieron guardar los datos de calibración."
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Monitor de Signos Vitales</h2>
        <Button
          variant="outline"
          onClick={() => setShowCalibration(true)}
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Calibración
        </Button>
      </div>

      {!isCalibrated && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 mb-4">
          <p className="text-yellow-300 text-sm">
            Por favor, realice la calibración inicial para obtener mediciones más precisas.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Heart className="w-6 h-6 text-[#ea384c]" />
              <h2 className="text-xl font-semibold text-gray-100">Heart Rate</h2>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-gray-100">{Math.round(bpm) || 0}</span>
              <span className="text-sm text-gray-300">BPM</span>
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Droplets className="w-6 h-6 text-[#3b82f6]" />
              <h2 className="text-xl font-semibold text-gray-100">SpO2</h2>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-gray-100">{Math.round(spo2) || 0}</span>
              <span className="text-sm text-gray-300">%</span>
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="w-6 h-6 text-[#10b981]" />
              <h2 className="text-xl font-semibold text-gray-100">Blood Pressure</h2>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-bold text-gray-100">{Math.round(systolic) || 0}/{Math.round(diastolic) || 0}</span>
              <span className="text-sm text-gray-300">mmHg</span>
            </div>
          </div>
        </div>

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <AlertTriangle className={`w-6 h-6 ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-[#10b981]'}`} />
              <h2 className="text-xl font-semibold text-gray-100">Rhythm</h2>
            </div>
            <div className="flex items-baseline">
              <span className={`text-xl font-bold ${hasArrhythmia ? 'text-[#f59e0b]' : 'text-gray-100'}`}>
                {arrhythmiaType}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-center mb-4">
        <Button
          onClick={toggleMeasurement}
          className={`px-6 py-3 text-lg ${isStarted ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`}
        >
          {isStarted ? (
            <>
              <StopCircle className="mr-2" />
              Detener Medición
            </>
          ) : (
            <>
              <PlayCircle className="mr-2" />
              Iniciar Medición
            </>
          )}
        </Button>
      </div>

      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <CameraView onFrame={handleFrame} isActive={isStarted} />
      </div>
      
      <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 shadow-lg">
        <h3 className="text-lg font-medium mb-4 text-gray-100">Señal PPG en Tiempo Real</h3>
        <VitalChart data={readings} color="#ea384c" />
      </div>

      <CalibrationDialog 
        open={showCalibration} 
        onOpenChange={setShowCalibration}
        onComplete={handleCalibrationComplete}
      />
    </div>
  );
};

export default HeartRateMonitor;
