import { SignalFilter } from './SignalFilter';
import { FingerDetector } from './FingerDetector';
import { WaveletAnalyzer } from './WaveletAnalyzer';
import { SignalQualityAnalyzer } from './SignalQualityAnalyzer';
import { BeepPlayer } from './BeepPlayer';
import type { PPGData, SensitivitySettings, ArrhythmiaType } from '@/types';

export class PPGProcessor {
  private readonly components = {
    signalFilter: new SignalFilter(),
    fingerDetector: new FingerDetector(),
    waveletAnalyzer: new WaveletAnalyzer(),
    qualityAnalyzer: new SignalQualityAnalyzer(),
    beepPlayer: new BeepPlayer()
  };

  private settings: SensitivitySettings;
  private buffer: number[] = [];
  private readonly bufferSize = 180;  // 6 segundos a 30fps
  private lastProcessedTime: number = 0;

  constructor() {
    this.settings = {
      signalAmplification: 1.2,
      noiseReduction: 1.5,
      peakDetection: 1.1,
      heartbeatThreshold: 0.7,
      responseTime: 1.2,
      signalStability: 0.7,
      brightness: 0.8,
      redIntensity: 1.2
    };
  }

  public async processFrame(imageData: ImageData): Promise<PPGData | null> {
    try {
      const now = Date.now();
      if (!this.shouldProcessFrame(now)) return null;

      const fingerPresent = this.components.fingerDetector.detectFinger(imageData);
      if (!fingerPresent.isPresent) {
        return this.getDefaultPPGData(now);
      }

      const redValue = this.extractRedValue(imageData);
      this.updateBuffer(redValue);
      const filteredSignal = this.components.signalFilter.filter(this.buffer);
      
      const quality = this.components.qualityAnalyzer.analyzeQuality(filteredSignal);
      if (quality < 0.3) {
        return this.getDefaultPPGData(now);
      }

      const { peaks } = this.components.waveletAnalyzer.analyzeSignal(filteredSignal);
      
      const bpm = this.calculateBPM(peaks.map(peak => peak.value));
      const spo2 = this.calculateSpO2(imageData, quality);
      const { systolic, diastolic } = this.estimateBloodPressure(bpm, peaks);
      const arrhythmia = this.analyzeArrhythmia(peaks);

      if (this.shouldBeep(peaks)) {
        await this.components.beepPlayer.playBeep('heartbeat', quality);
      }

      return {
        bpm,
        spo2,
        systolic,
        diastolic,
        ...arrhythmia,
        confidence: quality,
        readings: filteredSignal,
        isPeak: peaks.includes(this.buffer.length - 1),
        signalQuality: quality,
        timestamp: now,
        value: redValue
      };

    } catch (error) {
      console.error('Error procesando frame:', error);
      return this.getDefaultPPGData(now);
    }
  }

  private getDefaultPPGData(timestamp: number): PPGData {
    return {
      bpm: 0,
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      hasArrhythmia: false,
      arrhythmiaType: 'Normal',
      confidence: 0,
      readings: [],
      isPeak: false,
      signalQuality: 0,
      timestamp,
      value: 0
    };
  }

  private shouldProcessFrame(now: number): boolean {
    if (now - this.lastProcessedTime < 33) return false;
    this.lastProcessedTime = now;
    return true;
  }

  private extractRedValue(imageData: ImageData): number {
    const data = imageData.data;
    let totalRed = 0;
    let pixelCount = 0;

    const centerRegion = this.getCenterRegion(imageData);
    for (let i = centerRegion.start; i < centerRegion.end; i += 4) {
      totalRed += data[i];
      pixelCount++;
    }

    return totalRed / pixelCount;
  }

  private getCenterRegion(imageData: ImageData) {
    const width = imageData.width;
    const height = imageData.height;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = Math.floor(Math.min(width, height) * 0.3);

    const start = (centerY - regionSize/2) * width * 4 + (centerX - regionSize/2) * 4;
    const end = (centerY + regionSize/2) * width * 4 + (centerX + regionSize/2) * 4;

    return { start, end };
  }

  private updateBuffer(value: number): void {
    this.buffer.push(value);
    if (this.buffer.length > this.bufferSize) {
      this.buffer.shift();
    }
  }

  private calculateBPM(peaks: number[]): number {
    if (peaks.length < 2) return 0;
    
    const intervals = peaks.slice(1).map((peak, i) => peak - peaks[i]);
    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60000 / (averageInterval * (1000/30)));

    return Math.min(Math.max(bpm, 45), 180);
  }

  private calculateSpO2(imageData: ImageData, quality: number): number {
    const { red, ir } = this.extractChannels(imageData);
    if (red === 0 || ir === 0) return 0;

    const ratio = Math.log(red) / Math.log(ir);
    const baseSpO2 = 110 - (25 * ratio);
    const compensatedSpO2 = baseSpO2 + (quality * 2);

    return Math.min(Math.max(Math.round(compensatedSpO2), 90), 100);
  }

  private extractChannels(imageData: ImageData) {
    const data = imageData.data;
    let redTotal = 0;
    let irTotal = 0;
    let pixelCount = 0;

    const centerRegion = this.getCenterRegion(imageData);
    for (let i = centerRegion.start; i < centerRegion.end; i += 4) {
      redTotal += data[i];
      irTotal += (data[i + 1] + data[i + 2]) / 2;
      pixelCount++;
    }

    return {
      red: redTotal / pixelCount,
      ir: irTotal / pixelCount
    };
  }

  private estimateBloodPressure(bpm: number, peaks: number[]): { systolic: number; diastolic: number } {
    if (bpm === 0) return { systolic: 0, diastolic: 0 };

    const intervals = peaks.slice(1).map((peak, i) => peak - peaks[i]);
    const variability = this.calculateVariability(intervals);
    
    const baseSystemic = 120;
    const baseDiastolic = 80;
    
    const systolic = Math.round(baseSystemic + ((bpm - 70) * 0.5 + variability * 10));
    const diastolic = Math.round(baseDiastolic + ((bpm - 70) * 0.3 + variability * 5));
    
    return { 
      systolic: Math.min(Math.max(systolic, 90), 180),
      diastolic: Math.min(Math.max(diastolic, 60), 120)
    };
  }

  private calculateVariability(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return intervals.reduce((a, b) => a + Math.abs(b - mean), 0) / intervals.length / mean;
  }

  private analyzeArrhythmia(peaks: number[]): { hasArrhythmia: boolean; arrhythmiaType: ArrhythmiaType } {
    if (peaks.length < 5) {
      return { hasArrhythmia: false, arrhythmiaType: 'Normal' };
    }

    const intervals = peaks.slice(1).map((peak, i) => peak - peaks[i]);
    const variability = this.calculateVariability(intervals);
    const hasArrhythmia = variability > 0.2;

    return {
      hasArrhythmia,
      arrhythmiaType: hasArrhythmia ? 'Irregular' : 'Normal'
    };
  }

  private shouldBeep(peaks: number[]): boolean {
    return peaks.includes(this.buffer.length - 1);
  }

  public updateSettings(settings: SensitivitySettings): void {
    this.settings = { ...this.settings, ...settings };
  }

  public stop(): void {
    this.buffer = [];
    this.lastProcessedTime = 0;
    this.components.beepPlayer.stop();
  }
}
