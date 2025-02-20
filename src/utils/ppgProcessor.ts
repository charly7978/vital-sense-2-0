
import { VitalReading, PPGData } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalExtractor } from './signalExtraction';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private readonly windowSize = 300;
  private readonly signalExtractor: SignalExtractor;
  private beepPlayer: BeepPlayer;
  private lastPeakTime = 0;
  private peakThreshold = 0;
  private valleys: number[] = [];
  private peaks: number[] = [];
  private lastValidBpm = 0;
  
  constructor() {
    this.signalExtractor = new SignalExtractor();
    this.beepPlayer = new BeepPlayer();
  }

  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    const now = Date.now();
    const { red, quality } = this.signalExtractor.extractChannels(imageData);
    
    if (quality < 0.2 || red === 0) {
      this.readings = [];
      this.valleys = [];
      this.peaks = [];
      return {
        bpm: 0,
        spo2: 0,
        systolic: 0,
        diastolic: 0,
        hasArrhythmia: false,
        arrhythmiaType: 'Normal',
        signalQuality: 0,
        confidence: 0,
        readings: [],
        isPeak: false,
        hrvMetrics: {
          sdnn: 0,
          rmssd: 0,
          pnn50: 0,
          lfhf: 0
        }
      };
    }

    this.readings.push({ timestamp: now, value: red });
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }

    // Actualizar umbral dinámicamente
    if (this.readings.length > 30) {
      const recentValues = this.readings.slice(-30).map(r => r.value);
      const mean = recentValues.reduce((a, b) => a + b) / recentValues.length;
      const stdDev = Math.sqrt(
        recentValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentValues.length
      );
      this.peakThreshold = mean + stdDev * 0.5;
    }

    // Detectar pico
    const isPeak = this.detectPeak(red, now);
    
    // Calcular BPM basado en los últimos picos
    let bpm = 0;
    if (this.peaks.length >= 2) {
      const recentIntervals = [];
      for (let i = 1; i < this.peaks.length; i++) {
        const interval = this.peaks[i] - this.peaks[i-1];
        if (interval > 300 && interval < 1500) { // Entre 40 y 200 BPM
          recentIntervals.push(interval);
        }
      }
      
      if (recentIntervals.length > 0) {
        const avgInterval = recentIntervals.reduce((a, b) => a + b) / recentIntervals.length;
        bpm = Math.round(60000 / avgInterval);
        
        // Validar BPM
        if (bpm >= 40 && bpm <= 200) {
          this.lastValidBpm = bpm;
        } else {
          bpm = this.lastValidBpm;
        }
      } else {
        bpm = this.lastValidBpm;
      }
    }

    return {
      bpm,
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      hasArrhythmia: false,
      arrhythmiaType: 'Normal',
      signalQuality: quality,
      confidence: quality,
      readings: this.readings,
      isPeak,
      hrvMetrics: {
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        lfhf: 0
      }
    };
  }

  private detectPeak(value: number, timestamp: number): boolean {
    if (this.readings.length < 3) return false;

    const minPeakDistance = 300; // Mínimo 300ms entre picos (máximo 200 BPM)
    const timeSinceLastPeak = timestamp - this.lastPeakTime;

    if (timeSinceLastPeak < minPeakDistance) return false;

    const prev = this.readings[this.readings.length - 2].value;
    const current = value;

    // Detectar pico cuando el valor actual es mayor que el umbral y mayor que el valor anterior
    if (current > this.peakThreshold && current > prev) {
      this.peaks.push(timestamp);
      if (this.peaks.length > 10) this.peaks.shift();
      
      this.lastPeakTime = timestamp;
      console.log('Pico detectado:', {
        valor: current,
        umbral: this.peakThreshold,
        tiempo: timestamp
      });
      
      return true;
    }

    return false;
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }
}
