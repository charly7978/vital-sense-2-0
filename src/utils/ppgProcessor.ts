
import { VitalReading, UserCalibration } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private peakTimes: number[] = [];
  private readonly samplingRate = 30;
  private readonly windowSize = 300;
  private readonly signalProcessor: SignalProcessor;
  private beepPlayer: BeepPlayer;
  private lastPeakTime: number = 0;
  private readonly minPeakDistance = 500; // ms
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 30;
  private baseline = 0;
  private adaptiveThreshold = 0;
  private readonly qualityThreshold = 0.6;
  private calibrationData: UserCalibration | null = null;
  
  constructor() {
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
  }

  setCalibrationData(data: UserCalibration) {
    this.calibrationData = data;
    this.signalProcessor.updateCalibrationConstants(data);
  }

  processFrame(imageData: ImageData): { 
    bpm: number; 
    spo2: number; 
    systolic: number;
    diastolic: number;
    hasArrhythmia: boolean;
    arrhythmiaType: string;
    signalQuality: number;
  } | null {
    const now = Date.now();
    
    // Extracción mejorada de señales roja e infrarroja
    const { red, ir, quality } = this.extractChannels(imageData);
    
    // Verificar calidad de señal antes de procesar
    if (quality < this.qualityThreshold) {
      console.log('Señal de baja calidad, esperando mejor colocación del dedo');
      return null;
    }
    
    this.redBuffer.push(red);
    this.irBuffer.push(ir);
    
    if (this.redBuffer.length > this.windowSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
    
    // Filtrado y procesamiento de señal mejorado
    const filteredRed = this.signalProcessor.lowPassFilter(this.redBuffer, 5);
    const normalizedValue = this.normalizeSignal(filteredRed[filteredRed.length - 1]);
    
    // Actualización de lecturas
    this.readings.push({ timestamp: now, value: normalizedValue });
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }

    // Buffer para suavizado
    this.signalBuffer.push(normalizedValue);
    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer.shift();
    }

    // Detección de picos mejorada con validación de calidad
    if (this.isRealPeak(normalizedValue, now)) {
      console.log('Peak detected at:', now);
      this.beepPlayer.playBeep();
      this.lastPeakTime = now;
      this.peakTimes.push(now);
      
      if (this.peakTimes.length > 10) {
        this.peakTimes.shift();
      }
    }

    // Análisis FFT para BPM más preciso
    const { frequencies, magnitudes } = this.signalProcessor.performFFT(filteredRed);
    const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
    const dominantFreq = frequencies[dominantFreqIndex];
    const fftBpm = dominantFreq * 60;
    
    // Análisis de intervalos RR para HRV
    const intervals = [];
    for (let i = 1; i < this.peakTimes.length; i++) {
      intervals.push(this.peakTimes[i] - this.peakTimes[i-1]);
    }
    
    // Análisis avanzado de arritmias
    const hrvAnalysis = this.signalProcessor.analyzeHRV(intervals);
    
    // Cálculo de SpO2 usando ratio-of-ratios
    const spo2 = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
    
    // Estimación de presión arterial usando características PPG y calibración
    const bp = this.calibrationData ? 
      this.signalProcessor.estimateBloodPressureWithCalibration(
        filteredRed, 
        this.peakTimes,
        this.calibrationData
      ) :
      this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);
    
    // Calcular calidad general de la señal
    const signalQuality = this.signalProcessor.analyzeSignalQuality(filteredRed);
    
    return {
      bpm: Math.round(fftBpm),
      spo2,
      systolic: bp.systolic,
      diastolic: bp.diastolic,
      hasArrhythmia: hrvAnalysis.hasArrhythmia,
      arrhythmiaType: hrvAnalysis.type,
      signalQuality
    };
  }

  private extractChannels(imageData: ImageData): { 
    red: number, 
    ir: number,
    quality: number 
  } {
    let redSum = 0;
    let irSum = 0;
    let pixelCount = 0;
    let saturationCount = 0;
    
    const width = imageData.width;
    const height = imageData.height;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = 50; // Área de interés optimizada
    
    // Análisis optimizado de la región central
    for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
      for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (y * width + x) * 4;
          const red = imageData.data[i];
          const green = imageData.data[i+1];
          const blue = imageData.data[i+2];
          
          // Detectar saturación
          if (red > 250 || red < 5) saturationCount++;
          
          redSum += red;
          // Aproximación mejorada para IR usando verde y azul
          irSum += (green * 0.7 + blue * 0.3);
          pixelCount++;
        }
      }
    }
    
    // Calcular calidad basada en saturación
    const quality = 1 - (saturationCount / pixelCount);
    
    return {
      red: pixelCount > 0 ? redSum / pixelCount : 0,
      ir: pixelCount > 0 ? irSum / pixelCount : 0,
      quality
    };
  }

  private normalizeSignal(value: number): number {
    // Normalización adaptativa mejorada con suavizado exponencial
    this.baseline = this.baseline * 0.95 + value * 0.05;
    const normalized = value - this.baseline;
    
    // Escalar la señal para mantener amplitud consistente
    const scale = 100; // Escala arbitraria para visualización
    return normalized * scale / Math.max(Math.abs(this.baseline), 1);
  }

  private isRealPeak(currentValue: number, now: number): boolean {
    if (now - this.lastPeakTime < this.minPeakDistance) {
      return false;
    }

    // Detección de picos adaptativa mejorada
    const avgSignal = this.signalBuffer.reduce((a, b) => a + b, 0) / this.signalBuffer.length;
    this.adaptiveThreshold = this.adaptiveThreshold * 0.95 + Math.abs(avgSignal) * 0.05;
    
    // Umbral dinámico basado en la variabilidad de la señal
    const threshold = this.adaptiveThreshold * 0.7;
    
    // Validación adicional de calidad de pico usando derivadas
    const isPeak = currentValue > threshold && 
                  currentValue > avgSignal && 
                  currentValue > this.signalBuffer[this.signalBuffer.length - 2] &&
                  this.validatePeakShape(currentValue);
    
    return isPeak;
  }

  private validatePeakShape(currentValue: number): boolean {
    if (this.signalBuffer.length < 3) return false;
    
    // Calcular derivadas
    const derivative1 = currentValue - this.signalBuffer[this.signalBuffer.length - 2];
    const derivative2 = this.signalBuffer[this.signalBuffer.length - 2] - 
                       this.signalBuffer[this.signalBuffer.length - 3];
    
    // Verificar forma del pico (debe tener pendiente positiva seguida de negativa)
    return derivative1 < 0 && derivative2 > 0;
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }
}

