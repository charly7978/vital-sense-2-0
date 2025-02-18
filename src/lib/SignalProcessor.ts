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
    
    // Inicializar sistema
    console.log('SignalProcessor inicializado');
  }

  public processFrame(conditions: SignalConditions): VitalSigns {
    try {
      if (!this.lastImageData) {
        console.log('No hay imagen disponible');
        return this.getDefaultVitalSigns();
      }

      // Extraer canales de color
      const { red, ir } = this.extractChannels(this.lastImageData);
      
      // Actualizar buffer
      this.buffer.push(red);
      if (this.buffer.length > this.bufferSize) {
        this.buffer.shift();
      }

      // Detección de dedo
      const fingerPresent = this.fingerDetector.detectFinger(this.lastImageData);
      if (!fingerPresent.isPresent) {
        console.log('Dedo no detectado');
        return this.getDefaultVitalSigns();
      }

      // Calidad de señal
      const signalQuality = this.qualityAnalyzer.analyzeQuality(this.buffer);
      if (signalQuality < 0.3) {
        console.log('Calidad de señal baja:', signalQuality);
        return this.getDefaultVitalSigns();
      }

      // Procesar señal PPG
      const filteredSignal = this.signalFilter.filter(this.buffer);
      const peaks = this.waveletAnalyzer.detectPeaks(filteredSignal);
      const intervals = this.calculatePeakIntervals(peaks);

      // Calcular BPM
      const bpm = this.calculateBPM(intervals);
      
      // Calcular SpO2
      const spo2 = this.calculateSpO2(red, ir);

      // Estimar presión arterial
      const { systolic, diastolic } = this.estimateBloodPressure(bpm, intervals);

      // Detectar arritmias
      const { hasArrhythmia, arrhythmiaType } = this.detectArrhythmia(intervals);

      console.log('Frame procesado:', { bpm, spo2, systolic, diastolic });
      
      return {
        bpm,
        spo2,
        systolic,
        diastolic,
        hasArrhythmia,
        arrhythmiaType
      };

    } catch (error) {
      console.error('Error procesando frame:', error);
      return this.getDefaultVitalSigns();
    }
  }

  private getDefaultVitalSigns(): VitalSigns {
    return {
      bpm: 0,
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      hasArrhythmia: false,
      arrhythmiaType: 'Normal'
    };
  }

  private calculateBPM(intervals: number[]): number {
    if (intervals.length === 0) return 0;
    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.round(60000 / averageInterval); // Convertir ms a BPM
  }

  private calculateSpO2(red: number, ir: number): number {
    if (red === 0 || ir === 0) return 0;
    const ratio = Math.log(red) / Math.log(ir);
    return Math.round(110 - (25 * ratio)); // Aproximación simple
  }

  private estimateBloodPressure(bpm: number, intervals: number[]): BloodPressure {
    const variability = this.calculateVariability(intervals);
    const baselineSystolic = 120;
    const baselineDiastolic = 80;

    return {
      systolic: Math.round(baselineSystolic + (bpm - 60) * 0.5 + variability * 10),
      diastolic: Math.round(baselineDiastolic + (bpm - 60) * 0.3 + variability * 5)
    };
  }

  private calculateVariability(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    const diffs = intervals.slice(1).map((val, i) => Math.abs(val - intervals[i]));
    return diffs.reduce((a, b) => a + b, 0) / diffs.length;
  }

  private detectArrhythmia(intervals: number[]): { hasArrhythmia: boolean; arrhythmiaType: ArrhythmiaType } {
    if (intervals.length < 5) {
      return { hasArrhythmia: false, arrhythmiaType: 'Normal' };
    }

    const variability = this.calculateVariability(intervals);
    const hasArrhythmia = variability > 100; // Umbral simple

    return {
      hasArrhythmia,
      arrhythmiaType: hasArrhythmia ? 'Irregular' : 'Normal'
    };
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
