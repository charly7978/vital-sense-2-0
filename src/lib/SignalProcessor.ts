import { SignalFilter } from '@/lib/SignalFilter';
import { FingerDetector } from '@/lib/FingerDetector';
import { PPGSynchronizer } from '@/lib/PPGSynchronizer';
import { AdaptiveCalibrator } from '@/lib/AdaptiveCalibrator';
import { WaveletAnalyzer } from '@/lib/WaveletAnalyzer';
import { SignalQualityAnalyzer } from '@/lib/SignalQualityAnalyzer';
import type { VitalSigns, BloodPressure, ArrhythmiaType, SignalConditions, MeasurementType } from '@/types';

export class SignalProcessor {
  private buffer: number[] = [];
  private readonly bufferSize = 180;
  public lastImageData: ImageData | null = null;
  private fingerDetector: FingerDetector;
  private ppgSynchronizer: PPGSynchronizer;
  private calibrator: AdaptiveCalibrator;
  private waveletAnalyzer: WaveletAnalyzer;
  private signalFilter: SignalFilter;
  private qualityAnalyzer: SignalQualityAnalyzer;

  constructor() {
    this.fingerDetector = new FingerDetector();
    this.ppgSynchronizer = new PPGSynchronizer();
    this.calibrator = new AdaptiveCalibrator();
    this.waveletAnalyzer = new WaveletAnalyzer();
    this.signalFilter = new SignalFilter();
    this.qualityAnalyzer = new SignalQualityAnalyzer();
  }

  public calculatePeakIntervals(peaks: number[]): number[] {
    if (peaks.length < 2) return [];
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i-1]);
    }
    return intervals;
  }

  public calculateLightLevel(): number {
    if (!this.lastImageData) return 0;
    const data = this.lastImageData.data;
    let totalBrightness = 0;
    for (let i = 0; i < data.length; i += 4) {
      totalBrightness += (data[i] + data[i + 1] + data[i + 2]) / 3;
    }
    return totalBrightness / (data.length / 4) / 255;
  }

  public calculateMovement(): number {
    if (this.buffer.length < 2) return 0;
    const differences = this.buffer.slice(1).map((val, i) => 
      Math.abs(val - this.buffer[i])
    );
    return Math.min(differences.reduce((a, b) => a + b, 0) / differences.length / 10, 1);
  }

  public calculateCoverage(): number {
    if (!this.lastImageData) return 0;
    return this.fingerDetector.detectFinger(this.lastImageData).confidence;
  }

  public calculateStability(): number {
    if (this.buffer.length < 10) return 0;
    const recentValues = this.buffer.slice(-10);
    const mean = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const variance = recentValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recentValues.length;
    return Math.exp(-Math.sqrt(variance) / mean);
  }

  public estimateTemperature(): number {
    return 20 + (this.calculateLightLevel() * 10);
  }

  private createSignalConditions(signalQuality: number): SignalConditions {
    return {
      brightness: this.calculateLightLevel(),
      stability: this.calculateStability(),
      quality: signalQuality,
      signalQuality,
      lightLevel: this.calculateLightLevel(),
      movement: this.calculateMovement(),
      coverage: this.calculateCoverage(),
      measurementType: 'bpm',
      temperature: this.estimateTemperature()
    };
  }

  public processFrame(conditions: any): any {
    // Implementación básica
    return {
      bpm: 75,
      spo2: 98,
      systolic: 120,
      diastolic: 80,
      hasArrhythmia: false,
      arrhythmiaType: 'Normal' as const
    };
  }

  public extractChannels(imageData: ImageData): { red: number; ir: number } {
    this.lastImageData = imageData;
    const data = imageData.data;
    let totalRed = 0;
    let totalIR = 0;
    let pixelCount = 0;

    for (let i = 0; i < data.length; i += 4) {
      totalRed += data[i];
      totalIR += (data[i + 1] + data[i + 2]) / 2; // Aproximación IR
      pixelCount++;
    }

    return {
      red: totalRed / pixelCount,
      ir: totalIR / pixelCount
    };
  }
}
