import * as React from 'react';
import { useToast } from "@/hooks/use-toast";
import CameraView from './CameraView';
import VitalChart from './VitalChart';
import BPCalibrationForm from './BPCalibrationForm';
import VitalSignsDisplay from './vitals/VitalSignsDisplay';
import SignalQualityIndicator from './vitals/SignalQualityIndicator';
import MeasurementControls from './vitals/MeasurementControls';
import { PPGProcessor } from '../utils/ppgProcessor';
import { useVitals } from '@/contexts/VitalsContext';
import { useEffect, useCallback, useMemo } from 'react';

const ppgProcessor = new PPGProcessor();

const HeartRateMonitor: React.FC = () => {
  const { 
    bpm, 
    spo2, 
    systolic, 
    diastolic, 
    hasArrhythmia, 
    arrhythmiaType,
    readings,
    isStarted,
    measurementProgress,
    measurementQuality,
    toggleMeasurement,
    processFrame
  } = useVitals();

  const { toast } = useToast();

  // Detectar plataforma
  const isAndroid = useMemo(() => /Android/i.test(navigator.userAgent), []);
  const isWindows = useMemo(() => /Windows/i.test(navigator.userAgent), []);

  useEffect(() => {
    // Configuración inicial según plataforma
    if (isAndroid) {
      toast({
        title: "Configuración Android",
        description: "Por favor, use la cámara trasera con la linterna encendida",
        variant: "default",
      });
    } else if (isWindows) {
      toast({
        title: "Configuración Windows",
        description: "Asegúrese de tener buena iluminación ambiental",
        variant: "default",
      });
    }

    // Orientación solo para Android
    const handleOrientation = () => {
      if (isAndroid && window.screen.orientation) {
        if (!window.screen.orientation.type.includes('portrait')) {
          toast({
            title: "Orientación incorrecta",
            description: "Por favor, use el dispositivo en modo vertical",
            variant: "destructive",
          });
        }
      }
    };

    window.addEventListener('orientationchange', handleOrientation);
    return () => window.removeEventListener('orientationchange', handleOrientation);
  }, [toast, isAndroid, isWindows]);

  // Optimizar el procesamiento de frames con useMemo
  const frameProcessor = useMemo(() => {
    const bufferSize = 100; // Tamaño del buffer para análisis
    let frameBuffer: number[] = [];
    
    return {
      processBuffer: (value: number) => {
        frameBuffer.push(value);
        if (frameBuffer.length > bufferSize) {
          frameBuffer.shift();
        }
        
        // Filtrado de ruido usando media móvil
        const filteredValue = frameBuffer.reduce((a, b) => a + b, 0) / frameBuffer.length;
        return filteredValue;
      },
      
      resetBuffer: () => {
        frameBuffer = [];
      }
    };
  }, []);

  const handleFrameProcessing = useCallback(
    async (frame: ImageData) => {
      // Optimizar frame según plataforma
      const optimizedFrame = isAndroid 
        ? await optimizeAndroidFrame(frame)
        : await optimizeWebcamFrame(frame);

      const brightness = calculateBrightness(optimizedFrame);
      
      // Diferentes umbrales según plataforma
      const brightnessThreshold = isAndroid ? 50 : 30;
      if (brightness < brightnessThreshold) {
        toast({
          title: "Iluminación insuficiente",
          description: isAndroid 
            ? "Asegúrese de que la linterna esté encendida y el dedo bien colocado"
            : "Mejore la iluminación ambiental y acerque el dedo a la cámara",
          variant: "destructive",
        });
        return null;
      }

      // Detección de movimiento adaptativa
      const movement = detectMovement(optimizedFrame);
      const movementThreshold = isAndroid ? 0.4 : 0.6;
      if (movement > movementThreshold) {
        toast({
          title: "Movimiento detectado",
          description: "Mantenga el dedo quieto para una mejor medición",
          variant: "destructive",
        });
      }

      return processFrame(optimizedFrame);
    },
    [processFrame, toast, isAndroid]
  );

  const memoizedCameraView = useMemo(() => (
    <CameraView 
      onFrame={handleFrameProcessing} 
      isActive={isStarted}
      options={{
        facingMode: isAndroid ? 'environment' : 'user',
        frameRate: { ideal: 30, max: 30 },
        width: { ideal: isAndroid ? 1280 : 640 },
        height: { ideal: isAndroid ? 720 : 480 },
        aspectRatio: isAndroid ? 4/3 : 16/9,
      }}
    />
  ), [handleFrameProcessing, isStarted, isAndroid]);

  // Optimizar la limpieza de recursos
  useEffect(() => {
    return () => {
      frameProcessor.resetBuffer();
    };
  }, [frameProcessor]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-w-7xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-xl font-semibold text-gray-100">Monitor de Signos Vitales</h2>
        </div>

        <VitalSignsDisplay
          bpm={bpm}
          spo2={spo2}
          systolic={systolic}
          diastolic={diastolic}
          hasArrhythmia={hasArrhythmia}
          arrhythmiaType={arrhythmiaType}
        />

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
          {memoizedCameraView}
          {isStarted && bpm === 0 && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
              <p className="text-yellow-300 text-sm">
                No se detecta el dedo en la cámara. Por favor, coloque su dedo sobre el lente y asegúrese de que la linterna esté encendida.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        {isStarted && (
          <SignalQualityIndicator
            isStarted={isStarted}
            measurementQuality={measurementQuality}
            measurementProgress={measurementProgress}
          />
        )}

        <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4">
          <h3 className="text-lg font-medium mb-2 text-gray-100">Señal PPG en Tiempo Real</h3>
          <VitalChart data={readings} color="#ea384c" />
        </div>

        <MeasurementControls
          isStarted={isStarted}
          onToggleMeasurement={toggleMeasurement}
        />
      </div>
    </div>
  );
};

const calculateBrightness = (frame: ImageData): number => {
  let sum = 0;
  for (let i = 0; i < frame.data.length; i += 4) {
    const r = frame.data[i];
    const g = frame.data[i + 1];
    const b = frame.data[i + 2];
    sum += (r + g + b) / 3;
  }
  return sum / (frame.width * frame.height);
};

// Optimización de la detección de movimiento para Android
const detectMovement = (frame: ImageData): number => {
  const samplingRate = 10; // Analizar 1 de cada 10 píxeles para mejor rendimiento
  let totalDiff = 0;
  let samples = 0;

  for (let i = 0; i < frame.data.length; i += (4 * samplingRate)) {
    const r = frame.data[i];
    const g = frame.data[i + 1];
    const b = frame.data[i + 2];
    const brightness = (r + g + b) / 3;
    
    if (previousFrame[i/4]) {
      totalDiff += Math.abs(brightness - previousFrame[i/4]);
      samples++;
    }
    previousFrame[i/4] = brightness;
  }

  return samples > 0 ? totalDiff / samples / 255 : 0;
};

let previousFrame: number[] = [];

// Funciones de optimización específicas por plataforma
const optimizeAndroidFrame = async (frame: ImageData): Promise<ImageData> => {
  // Optimizaciones específicas para Android
  const redChannel = new Uint8ClampedArray(frame.data.length/4);
  for(let i = 0; i < frame.data.length; i += 4) {
    redChannel[i/4] = frame.data[i]; // Solo canal rojo para PPG
  }
  
  // Reducir resolución para mejor rendimiento
  const scaleFactor = 0.5;
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) return frame;

  canvas.width = frame.width * scaleFactor;
  canvas.height = frame.height * scaleFactor;
  
  const imageData = new ImageData(
    new Uint8ClampedArray(frame.data),
    frame.width,
    frame.height
  );
  
  ctx.putImageData(imageData, 0, 0);
  return ctx.getImageData(0, 0, canvas.width, canvas.height);
};

const optimizeWebcamFrame = async (frame: ImageData): Promise<ImageData> => {
  // Optimizaciones específicas para webcam
  const enhancedData = new Uint8ClampedArray(frame.data);
  for(let i = 0; i < frame.data.length; i += 4) {
    // Aumentar contraste
    enhancedData[i] = Math.min(255, frame.data[i] * 1.2);     // R
    enhancedData[i+1] = Math.min(255, frame.data[i+1] * 1.2); // G
    enhancedData[i+2] = Math.min(255, frame.data[i+2] * 1.2); // B
  }
  
  return new ImageData(enhancedData, frame.width, frame.height);
};

export default HeartRateMonitor;
