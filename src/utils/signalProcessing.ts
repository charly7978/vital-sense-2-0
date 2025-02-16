import { PTTProcessor } from './pttProcessor';
import { PPGFeatureExtractor } from './ppgFeatureExtractor';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';
import { SignalQualityAnalyzer } from './signalQualityAnalyzer';
import { supabase } from "@/integrations/supabase/client";

export class SignalProcessor {
  private readonly windowSize: number;
  private readonly sampleRate = 30;
  private lastValidPressure = { systolic: 120, diastolic: 80 };
  private lastValidSpO2 = 98;
  private lastBPMTime = 0;
  private bpmBuffer: number[] = [];
  private readonly BPM_HISTORY_SIZE = 10;
  private readonly MIN_QUALITY_FOR_BP = 0.6;
  private noFingerTimer: number | null = null;
  private readonly RESET_DELAY = 2000;

  constructor(windowSize: number) {
    this.windowSize = windowSize;
    console.log('SignalProcessor inicializado');
  }

  async estimateBloodPressure(signal: number[], peakTimes: number[]): Promise<{ 
    systolic: number;
    diastolic: number;
  }> {
    const maxSignal = Math.max(...signal);
    if (maxSignal < 10) {
      if (this.noFingerTimer === null) {
        this.noFingerTimer = Date.now();
      } else if (Date.now() - this.noFingerTimer >= this.RESET_DELAY) {
        this.resetValues();
      }
      return this.lastValidPressure;
    }

    this.noFingerTimer = null;

    if (signal.length < 30 || peakTimes.length < 3) {
      console.log('Señal insuficiente para BP:', {
        signalLength: signal.length,
        peaksCount: peakTimes.length
      });
      return this.lastValidPressure;
    }

    try {
      const { data: calibrationData, error } = await supabase
        .from('medical_device_calibration')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.log('Error accediendo a calibración, usando estimación base:', error);
        return this.estimateWithoutCalibration(signal, peakTimes);
      }

      if (!calibrationData) {
        console.log('No hay datos de calibración, usando estimación base');
        return this.estimateWithoutCalibration(signal, peakTimes);
      }

      return this.estimateWithCalibration(signal, peakTimes, calibrationData);
    } catch (error) {
      console.error('Error en estimación BP:', error);
      return this.lastValidPressure;
    }
  }

  private estimateWithoutCalibration(signal: number[], peakTimes: number[]): { 
    systolic: number;
    diastolic: number;
  } {
    const ptts = this.calculatePTTs(peakTimes);
    if (ptts.length < 2) return this.lastValidPressure;

    const avgPTT = ptts.reduce((a, b) => a + b, 0) / ptts.length;
    const pulseAmplitude = Math.max(...signal) - Math.min(...signal);

    let systolic = Math.round(120 - (avgPTT - 800) * 0.1);
    let diastolic = Math.round(systolic - 40);

    systolic += Math.round((pulseAmplitude - 50) * 0.2);
    diastolic += Math.round((pulseAmplitude - 50) * 0.1);

    systolic = Math.min(Math.max(systolic, 90), 160);
    diastolic = Math.min(Math.max(diastolic, 60), 90);

    this.lastValidPressure = {
      systolic: Math.round(this.lastValidPressure.systolic * 0.7 + systolic * 0.3),
      diastolic: Math.round(this.lastValidPressure.diastolic * 0.7 + diastolic * 0.3)
    };

    return this.lastValidPressure;
  }

  private estimateWithCalibration(
    signal: number[], 
    peakTimes: number[], 
    calibrationData: any
  ): { systolic: number; diastolic: number; } {
    const ptts = this.calculatePTTs(peakTimes);
    if (ptts.length < 2) return this.lastValidPressure;

    const avgPTT = ptts.reduce((a, b) => a + b, 0) / ptts.length;
    const pulseAmplitude = Math.max(...signal) - Math.min(...signal);

    const baselinePressure = calibrationData.baseline_pressure || 120;
    const calibrationFactor = calibrationData.calibration_factor || 1.0;

    let systolic = Math.round(
      baselinePressure +
      (avgPTT - 800) * -0.3 * calibrationFactor +
      (pulseAmplitude - 50) * 0.2
    );

    let diastolic = Math.round(systolic - 40);

    systolic = Math.min(Math.max(systolic, 90), 160);
    diastolic = Math.min(Math.max(diastolic, 60), 90);

    this.lastValidPressure = {
      systolic: Math.round(this.lastValidPressure.systolic * 0.8 + systolic * 0.2),
      diastolic: Math.round(this.lastValidPressure.diastolic * 0.8 + diastolic * 0.2)
    };

    return this.lastValidPressure;
  }

  private calculatePTTs(peakTimes: number[]): number[] {
    const ptts = [];
    for (let i = 1; i < peakTimes.length; i++) {
      const ptt = peakTimes[i] - peakTimes[i-1];
      if (ptt >= 500 && ptt <= 1200) {
        ptts.push(ptt);
      }
    }
    return ptts;
  }

  private resetValues() {
    this.lastValidPressure = { systolic: 120, diastolic: 80 };
    this.bpmBuffer = [];
    console.log('SignalProcessor: valores reseteados');
  }

  private calculateMovingAverage(values: number[], windowSize: number): number {
    if (values.length === 0) return 0;
    const window = values.slice(-windowSize);
    return window.reduce((a, b) => a + b, 0) / window.length;
  }

  calculateSpO2(redSignal: number[], irSignal: number[]): {
    spo2: number;
    confidence: number;
  } {
    if (redSignal.length < 10 || irSignal.length < 10) {
      return { spo2: this.lastValidSpO2, confidence: 0 };
    }

    try {
      const windowSize = Math.min(30, redSignal.length);
      const redWindow = redSignal.slice(-windowSize);
      const irWindow = irSignal.slice(-windowSize);

      const redAC = Math.max(...redWindow) - Math.min(...redWindow);
      const irAC = Math.max(...irWindow) - Math.min(...irWindow);
      const redDC = this.calculateMovingAverage(redWindow, windowSize);
      const irDC = this.calculateMovingAverage(irWindow, windowSize);

      const R = (redAC * irDC) / (irAC * redDC);
      
      let spo2 = 110 - 25 * R;
      
      if (spo2 >= 85 && spo2 <= 100) {
        this.lastValidSpO2 = Math.round(
          this.lastValidSpO2 * 0.7 + spo2 * 0.3
        );
      }

      const confidence = Math.min(
        (redAC / redDC) * (irAC / irDC) * 100,
        100
      );

      return {
        spo2: this.lastValidSpO2,
        confidence: Math.max(0, Math.min(confidence, 100))
      };
    } catch (error) {
      console.error('Error calculando SpO2:', error);
      return { spo2: this.lastValidSpO2, confidence: 0 };
    }
  }

  analyzeHRV(intervals: number[]): {
    hasArrhythmia: boolean;
    type: string;
    sdnn: number;
    rmssd: number;
    pnn50: number;
    lfhf: number;
  } {
    if (intervals.length < 3) {
      return {
        hasArrhythmia: false,
        type: 'Normal',
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        lfhf: 1
      };
    }

    const validIntervals = intervals.filter(
      interval => interval >= 500 && interval <= 1500
    );

    if (validIntervals.length < 3) {
      return {
        hasArrhythmia: false,
        type: 'Normal',
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        lfhf: 1
      };
    }

    const mean = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
    
    const sdnn = Math.sqrt(
      validIntervals.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / 
      (validIntervals.length - 1)
    );

    let rmssd = 0;
    let nn50 = 0;
    for (let i = 1; i < validIntervals.length; i++) {
      const diff = Math.abs(validIntervals[i] - validIntervals[i-1]);
      rmssd += diff * diff;
      if (diff > 50) nn50++;
    }
    rmssd = Math.sqrt(rmssd / (validIntervals.length - 1));
    const pnn50 = (nn50 / (validIntervals.length - 1)) * 100;

    const hasArrhythmia = sdnn > 100 || (rmssd > 50 && pnn50 > 20);
    let type = 'Normal';

    if (hasArrhythmia) {
      if (mean < 600) type = 'Taquicardia';
      else if (mean > 1000) type = 'Bradicardia';
      else if (pnn50 > 30) type = 'Arritmia Variable';
    }

    return {
      hasArrhythmia,
      type,
      sdnn,
      rmssd,
      pnn50,
      lfhf: 1.5
    };
  }

  analyzeSignalQuality(signal: number[]): number {
    if (!signal || signal.length < 10) return 0;

    try {
      const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
      const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;

      const noise = Math.sqrt(variance);
      const signal_power = Math.pow(mean, 2);
      const snr = signal_power / (noise + 1e-6);

      return Math.min(Math.max(snr / 100, 0), 1);
    } catch (error) {
      console.error('Error analizando calidad:', error);
      return 0;
    }
  }
}
