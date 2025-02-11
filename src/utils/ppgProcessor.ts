
import { VitalReading } from './types';
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
  private readonly minPeakDistance = 500;
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 30;
  private baseline = 0;
  private adaptiveThreshold = 0;
  
  constructor() {
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
  }

  processFrame(imageData: ImageData): { 
    bpm: number; 
    spo2: number; 
    systolic: number;
    diastolic: number;
    hasArrhythmia: boolean;
    arrhythmiaType: string;
  } {
    const now = Date.now();
    
    // Extraer señales roja e infrarroja
    const { red, ir } = this.extractChannels(imageData);
    this.redBuffer.push(red);
    this.irBuffer.push(ir);
    
    // Mantener buffer de tamaño fijo
    if (this.redBuffer.length > this.windowSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
    
    // Aplicar filtro paso bajo
    const filteredRed = this.signalProcessor.lowPassFilter(this.redBuffer, 5);
    const normalizedValue = this.normalizeSignal(filteredRed[filteredRed.length - 1]);
    
    // Actualizar lecturas
    this.readings.push({ timestamp: now, value: normalizedValue });
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }

    // Buffer para suavizado
    this.signalBuffer.push(normalizedValue);
    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer.shift();
    }

    // Detección de picos mejorada
    if (this.isRealPeak(normalizedValue, now)) {
      console.log('Peak detected at:', now);
      this.beepPlayer.playBeep();
      this.lastPeakTime = now;
      this.peakTimes.push(now);
      
      // Mantener solo los últimos 10 picos
      if (this.peakTimes.length > 10) {
        this.peakTimes.shift();
      }
    }

    // Calcular BPM usando FFT para mayor precisión
    const { frequencies, magnitudes } = this.signalProcessor.performFFT(filteredRed);
    const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
    const dominantFreq = frequencies[dominantFreqIndex];
    const fftBpm = dominantFreq * 60;
    
    // Calcular intervalos RR para análisis HRV
    const intervals = [];
    for (let i = 1; i < this.peakTimes.length; i++) {
      intervals.push(this.peakTimes[i] - this.peakTimes[i-1]);
    }
    
    // Análisis de arritmias
    const hrvAnalysis = this.signalProcessor.analyzeHRV(intervals);
    
    // Calcular SpO2
    const spo2 = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
    
    // Estimar presión arterial
    const bp = this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);
    
    return {
      bpm: Math.round(fftBpm),
      spo2,
      systolic: bp.systolic,
      diastolic: bp.diastolic,
      hasArrhythmia: hrvAnalysis.hasArrhythmia,
      arrhythmiaType: hrvAnalysis.type
    };
  }

  private extractChannels(imageData: ImageData): { red: number, ir: number } {
    let redSum = 0;
    let irSum = 0;
    let pixelCount = 0;
    
    const width = imageData.width;
    const height = imageData.height;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = 50;
    
    for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
      for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (y * width + x) * 4;
          redSum += imageData.data[i]; // Canal rojo
          irSum += (imageData.data[i+1] + imageData.data[i+2]) / 2; // Aproximación IR
          pixelCount++;
        }
      }
    }
    
    return {
      red: pixelCount > 0 ? redSum / pixelCount : 0,
      ir: pixelCount > 0 ? irSum / pixelCount : 0
    };
  }

  private normalizeSignal(value: number): number {
    this.baseline = this.baseline * 0.95 + value * 0.05;
    return value - this.baseline;
  }

  private isRealPeak(currentValue: number, now: number): boolean {
    if (now - this.lastPeakTime < this.minPeakDistance) {
      return false;
    }

    const avgSignal = this.signalBuffer.reduce((a, b) => a + b, 0) / this.signalBuffer.length;
    this.adaptiveThreshold = this.adaptiveThreshold * 0.95 + Math.abs(avgSignal) * 0.05;
    const threshold = this.adaptiveThreshold * 0.7;
    
    return currentValue > threshold && 
           currentValue > avgSignal && 
           currentValue > this.signalBuffer[this.signalBuffer.length - 2];
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }
}
