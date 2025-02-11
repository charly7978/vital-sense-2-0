import React, { useState, useCallback, useEffect } from 'react';
import { Heart, Droplets, Activity, AlertTriangle, PlayCircle, StopCircle, Hand, SignalHigh, SignalMedium, SignalLow } from 'lucide-react';
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import SensitivityControls from './SensitivityControls';
import CalibrationPanel from './CalibrationPanel';
import { PPGProcessor } from '../utils/ppgProcessor';
import { BeepPlayer } from '../utils/audioUtils';
import type { VitalReading, PPGData, SensitivitySettings } from '../utils/types';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

const ppgProcessor = new PPGProcessor();
const beepPlayer = new BeepPlayer();

const MEASUREMENT_DURATION = 30; // segundos

const defaultSensitivitySettings: SensitivitySettings = {
  signalAmplification: 1,
  noiseReduction: 1,
  peakDetection: 1
};

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
  const [measurementProgress, setMeasurementProgress] = useState(0);
  const [measurementQuality, setMeasurementQuality] = useState(0);
  const [measurementStartTime, setMeasurementStartTime] = useState<number | null>(null);
  const [sensitivitySettings, setSensitivitySettings] = useState<SensitivitySettings>(defaultSensitivitySettings);
  const { toast } = useToast();

  const handleSensitivityChange = (newSettings: SensitivitySettings) => {
    setSensitivitySettings(newSettings);
    ppgProcessor.updateSensitivitySettings(newSettings);
  };

  const handleCalibrationChange = (key: string, value: number) => {
    const newSettings = {
      ...sensitivitySettings,
      [key]: value
    };
    
    setSensitivitySettings(newSettings);
    ppgProcessor.updateSensitivitySettings(newSettings);
    
    toast({
      title: "Calibración actualizada",
      description: `${key} ajustado a ${value}`,
    });
  };

  const handleFrame = useCallback((imageData: ImageData) => {
    if (!isStarted) return;
    
    setIsProcessing(true);
    try {
      const vitals = ppgProcessor.processFrame(imageData);
      if (vitals) {
        if (vitals.isPeak === true) {
          beepPlayer.playBeep('heartbeat');
        }

        setMeasurementQuality(vitals.signalQuality);
        
        if (vitals.signalQuality > 0) {
          setBpm(vitals.bpm || 0);
          setSpo2(vitals.spo2 || 0);
          setSystolic(vitals.systolic || 0);
          setDiastolic(vitals.diastolic || 0);
          setHasArrhythmia(vitals.hasArrhythmia || false);
          setArrhythmiaType(vitals.arrhythmiaType || 'Normal');
          setReadings(ppgProcessor.getReadings());
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

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isStarted && measurementStartTime) {
      interval = setInterval(() => {
        const elapsed = (Date.now() - measurementStartTime) / 1000;
        const progress = Math.min((elapsed / MEASUREMENT_DURATION) * 100, 100);
        setMeasurementProgress(progress);

        if (elapsed >= MEASUREMENT_DURATION) {
          setIsStarted(false);
          beepPlayer.playBeep('success');
          toast({
            title: "Medición completada",
            description: "La medición se ha completado exitosamente."
          });
        }
      }, 100);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isStarted, measurementStartTime, toast]);

  const toggleMeasurement = () => {
    setIsStarted(!isStarted);
    if (!isStarted) {
      setMeasurementStartTime(Date.now());
      setMeasurementProgress(0);
      toast({
        title: "Iniciando medición",
        description: `La medición durará ${MEASUREMENT_DURATION} segundos. Por favor, mantenga su dedo frente a la cámara.`
      });
    } else {
      setMeasurementStartTime(null);
      setIsProcessing(false);
    }
  };

  const getSignalQualityIndicator = () => {
    if (!isStarted) return null;
    
    if (measurementQuality === 0) {
      return (
        <div className="flex items-center space-x-2 text-gray-400 animate-pulse">
          <Hand className="w-6 h-6" />
          <span>No se detecta el dedo</span>
        </div>
      );
    }
    
    if (measurementQuality < 0.3) {
      return (
        <div className="flex items-center space-x-2 text-red-500">
          <SignalLow className="w-6 h-6" />
          <span>Señal débil</span>
        </div>
      );
    }
    
    if (measurementQuality < 0.8) {
      return (
        <div className="flex items-center space-x-2 text-yellow-500">
          <SignalMedium className="w-6 h-6" />
          <span>Señal regular</span>
        </div>
      );
    }
    
    return (
      <div className="flex items-center space-x-2 text-green-500">
        <SignalHigh className="w-6 h-6 animate-pulse" />
        <span>Señal excelente</span>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-100">Monitor de Signos Vitales</h2>
      </div>

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

      <div className="flex flex-col gap-4">
        {isStarted && (
          <>
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Progreso de la medición</span>
                  <span>{Math.round(measurementProgress)}%</span>
                </div>
                <Progress value={measurementProgress} className="h-2" />
              </div>
            </div>

            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
              <div className="space-y-4">
                {getSignalQualityIndicator()}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-gray-400">
                    <span>Calidad de la señal</span>
                    <span>{Math.round(measurementQuality * 100)}%</span>
                  </div>
                  <Progress 
                    value={measurementQuality * 100} 
                    className={cn(
                      "h-2",
                      measurementQuality < 0.3 ? "destructive" : 
                      measurementQuality < 0.8 ? "warning" : ""
                    )}
                  />
                </div>
              </div>
            </div>
          </>
        )}

        <SensitivityControls 
          settings={sensitivitySettings}
          onSettingsChange={handleSensitivityChange}
        />

        <CalibrationPanel 
          settings={defaultSensitivitySettings}
          onSettingChange={handleCalibrationChange}
        />

        <div className="flex justify-center">
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
    </div>
  );
};

export default HeartRateMonitor;
