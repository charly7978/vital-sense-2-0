
import React, { useState, useCallback, useEffect } from 'react';
import { Heart, Droplets, Activity, AlertTriangle, PlayCircle, StopCircle, Settings } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import CalibrationDialog from './CalibrationDialog';
import { PPGProcessor } from '../utils/ppgProcessor';
import type { VitalReading, CalibrationData, UserCalibration } from '../utils/types';
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
      const { data: calibrationData, error } = await supabase
        .from('user_calibration')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (error) throw error;

      setIsCalibrated(!!calibrationData && calibrationData.length > 0);
      
      if (calibrationData && calibrationData.length > 0) {
        // Map database fields to UserCalibration type
        const mappedCalibration: UserCalibration = {
          id: calibrationData[0].id,
          age: calibrationData[0].age,
          height: calibrationData[0].height,
          weight: calibrationData[0].weight,
          systolic: calibrationData[0].reference_bp_systolic,
          diastolic: calibrationData[0].reference_bp_diastolic,
          deviceType: calibrationData[0].reference_device_type,
          is_active: calibrationData[0].is_active,
          calibration_constants: calibrationData[0].calibration_constants || {},
          calibration_history: Array.isArray(calibrationData[0].calibration_history) 
            ? calibrationData[0].calibration_history 
            : [],
          last_calibration_quality: calibrationData[0].last_calibration_quality,
          calibration_date: calibrationData[0].calibration_date,
          user_id: calibrationData[0].user_id
        };
        ppgProcessor.setCalibrationData(mappedCalibration);
      }
    } catch (error) {
      console.error('Error checking calibration:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo verificar el estado de calibración"
      });
    }
  };

  const storeMeasurement = async (measurementData: any) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user found');
        return;
      }

      const { error } = await supabase
        .from('vital_signs')
        .insert([{
          ...measurementData,
          user_id: user.id
        }]);

      if (error) {
        console.error('Error storing measurement:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error storing measurement:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron guardar las mediciones"
      });
    }
  };

  const handleFrame = useCallback((imageData: ImageData) => {
    if (!isStarted) return;
    
    setIsProcessing(true);
    try {
      const vitals = ppgProcessor.processFrame(imageData);
      if (vitals) {
        // Solo almacenar y mostrar mediciones cuando hay señal válida
        if (vitals.signalQuality > 0) {
          setBpm(vitals.bpm || 0);
          setSpo2(vitals.spo2 || 0);
          setSystolic(vitals.systolic || 0);
          setDiastolic(vitals.diastolic || 0);
          setHasArrhythmia(vitals.hasArrhythmia || false);
          setArrhythmiaType(vitals.arrhythmiaType || 'Normal');
          setReadings(ppgProcessor.getReadings());

          // Store measurement in database only if values are valid
          if (vitals.bpm > 0 && vitals.spo2 > 0) {
            storeMeasurement({
              heart_rate: vitals.bpm,
              spo2: vitals.spo2,
              systolic_pressure: vitals.systolic,
              diastolic_pressure: vitals.diastolic,
              arrhythmia_detected: vitals.hasArrhythmia,
              measurement_quality: vitals.signalQuality,
              ppg_signal_data: {
                readings: ppgProcessor.getReadings()
              }
            });
          }
        } else {
          // Resetear valores cuando no hay señal válida
          setBpm(0);
          setSpo2(0);
          setSystolic(0);
          setDiastolic(0);
          setHasArrhythmia(false);
          setArrhythmiaType('Normal');
          setReadings([]);
        }
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
    if (!isCalibrated && !isStarted) {
      toast({
        variant: "destructive",
        title: "Calibración requerida",
        description: "Por favor, realice la calibración antes de comenzar la medición."
      });
      return;
    }

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

  const handleCalibrationComplete = async (calibrationData: CalibrationData) => {
    try {
      const { error } = await supabase
        .from('user_calibration')
        .insert([{
          age: calibrationData.age,
          height: calibrationData.height,
          weight: calibrationData.weight,
          reference_bp_systolic: calibrationData.systolic,
          reference_bp_diastolic: calibrationData.diastolic,
          reference_device_type: calibrationData.deviceType,
          is_active: true,
          calibration_constants: {},
          last_calibration_quality: 1.0,
          calibration_history: []
        }]);

      if (error) throw error;

      setIsCalibrated(true);
      setShowCalibration(false);
      
      // Update processor with new calibration
      const { data: newCalibration } = await supabase
        .from('user_calibration')
        .select('*')
        .eq('is_active', true)
        .limit(1);

      if (newCalibration && newCalibration.length > 0) {
        // Map database fields to UserCalibration type
        const mappedCalibration: UserCalibration = {
          id: newCalibration[0].id,
          age: newCalibration[0].age,
          height: newCalibration[0].height,
          weight: newCalibration[0].weight,
          systolic: newCalibration[0].reference_bp_systolic,
          diastolic: newCalibration[0].reference_bp_diastolic,
          deviceType: newCalibration[0].reference_device_type,
          is_active: newCalibration[0].is_active,
          calibration_constants: newCalibration[0].calibration_constants || {},
          calibration_history: Array.isArray(newCalibration[0].calibration_history) 
            ? newCalibration[0].calibration_history 
            : [],
          last_calibration_quality: newCalibration[0].last_calibration_quality,
          calibration_date: newCalibration[0].calibration_date,
          user_id: newCalibration[0].user_id
        };
        ppgProcessor.setCalibrationData(mappedCalibration);
      }

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
        {isStarted && bpm === 0 && (
          <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
            <p className="text-yellow-300 text-sm text-center">
              No se detecta el dedo en la cámara. Por favor, coloque su dedo correctamente sobre el lente.
            </p>
          </div>
        )}
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
