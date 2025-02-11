
import { VitalReading } from './types';
import { BeepPlayer } from './audioUtils';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private lastProcessedTime: number = 0;
  private readonly samplingRate = 30; // 30 fps
  private readonly windowSize = 300; // 10 seconds at 30fps
  private readonly movingAverageSize = 5;
  private lastPeakTime: number = 0;
  private beepPlayer: BeepPlayer;
  private peakThreshold = 0;
  private valleyThreshold = 0;
  private lastPeakValue = 0;
  private baseline = 0;
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 500; // Mínimo 500ms entre picos (120 BPM máximo)
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 10;
  
  constructor() {
    this.beepPlayer = new BeepPlayer();
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
    
    // Extract red channel average (PPG signal)
    const redSum = this.extractRedChannelAverage(imageData);
    const normalizedValue = this.normalizeSignal(redSum);
    
    // Update readings array
    this.readings.push({ timestamp: now, value: normalizedValue });
    
    // Keep only the last 10 seconds of readings
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }

    // Buffer para suavizar la señal
    this.signalBuffer.push(normalizedValue);
    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer.shift();
    }

    // Detect peaks and play beep
    if (this.readings.length > 2) {
      const currentReading = this.readings[this.readings.length - 1];
      const prevReading = this.readings[this.readings.length - 2];
      
      if (this.isRealPeak(currentReading.value, prevReading.value, now)) {
        console.log('Peak detected at:', now);
        this.beepPlayer.playBeep();
        this.lastPeakTime = now;
      }
    }

    // Calculate real BPM based on peak intervals
    const bpm = this.calculateRealBPM();
    
    return {
      bpm: Math.round(bpm),
      spo2: 0, // Ya no simulamos SpO2
      systolic: 0, // Ya no simulamos presión arterial
      diastolic: 0,
      hasArrhythmia: false,
      arrhythmiaType: 'Medición no disponible'
    };
  }

  private extractRedChannelAverage(imageData: ImageData): number {
    let redSum = 0;
    let pixelCount = 0;
    
    // Solo procesamos la región central de la imagen
    const width = imageData.width;
    const height = imageData.height;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = 50; // pixels
    
    for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
      for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (y * width + x) * 4;
          redSum += imageData.data[i]; // Canal rojo
          pixelCount++;
        }
      }
    }
    
    return pixelCount > 0 ? redSum / pixelCount : 0;
  }

  private normalizeSignal(value: number): number {
    // Actualizar línea base con promedio móvil
    this.baseline = this.baseline * 0.95 + value * 0.05;
    
    // Normalizar alrededor de la línea base
    return value - this.baseline;
  }

  private isRealPeak(currentValue: number, prevValue: number, now: number): boolean {
    // Solo detectar picos si ha pasado suficiente tiempo desde el último
    if (now - this.lastPeakTime < this.minPeakDistance) {
      return false;
    }

    // Calcular el promedio de la señal en el buffer
    const avgSignal = this.signalBuffer.reduce((a, b) => a + b, 0) / this.signalBuffer.length;
    
    // Actualizar umbral adaptativo
    this.adaptiveThreshold = this.adaptiveThreshold * 0.95 + Math.abs(avgSignal) * 0.05;
    
    // Umbral dinámico para detección de picos
    const threshold = this.adaptiveThreshold * 0.7;
    
    // Un pico real debe ser mayor que el umbral y mayor que el valor anterior
    return currentValue > threshold && 
           currentValue > prevValue && 
           currentValue > avgSignal;
  }

  private calculateRealBPM(): number {
    if (this.readings.length < 2) return 0;
    
    // Encontrar todos los picos en los últimos 10 segundos
    const recentReadings = this.readings.slice(-300); // últimos 10 segundos a 30fps
    const peakTimes: number[] = [];
    
    for (let i = 1; i < recentReadings.length - 1; i++) {
      if (this.isRealPeak(
        recentReadings[i].value,
        recentReadings[i-1].value,
        recentReadings[i].timestamp
      )) {
        peakTimes.push(recentReadings[i].timestamp);
      }
    }
    
    // Calcular BPM basado en intervalos entre picos
    if (peakTimes.length < 2) return 0;
    
    const intervals: number[] = [];
    for (let i = 1; i < peakTimes.length; i++) {
      intervals.push(peakTimes[i] - peakTimes[i-1]);
    }
    
    // Calcular el promedio de intervalos
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    // Convertir a BPM
    return avgInterval > 0 ? 60000 / avgInterval : 0;
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }
}
