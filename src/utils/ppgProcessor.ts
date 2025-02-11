
import { VitalReading } from './types';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private lastProcessedTime: number = 0;
  private readonly samplingRate = 30; // 30 fps
  private readonly windowSize = 300; // 10 seconds at 30fps
  private readonly movingAverageSize = 5;
  private redValues: number[] = [];
  private infraredValues: number[] = [];
  private rrIntervals: number[] = [];
  private lastPeakTime: number = 0;
  
  private systolicCalibration: number = 120;
  private diastolicCalibration: number = 80;

  processFrame(imageData: ImageData): { 
    bpm: number; 
    spo2: number; 
    systolic: number;
    diastolic: number;
    hasArrhythmia: boolean;
    arrhythmiaType: string;
  } {
    const now = Date.now();
    const { redChannel, infraredChannel } = this.extractChannels(imageData);
    
    // Apply moving average filter to reduce noise
    const filteredRed = this.movingAverageFilter(redChannel);
    const filteredInfrared = this.movingAverageFilter(infraredChannel);
    
    // Store values for SpO2 calculation
    this.redValues.push(filteredRed);
    this.infraredValues.push(filteredInfrared);
    
    if (this.redValues.length > this.windowSize) {
      this.redValues = this.redValues.slice(-this.windowSize);
      this.infraredValues = this.infraredValues.slice(-this.windowSize);
    }
    
    const averageRed = this.calculateAverage(redChannel);
    this.readings.push({ timestamp: now, value: averageRed });
    
    // Keep only the last 10 seconds of readings
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }

    // Calculate time since last peak for RR interval
    if (this.isPeak(this.readings.length - 1, this.calculateDynamicThreshold())) {
      if (this.lastPeakTime > 0) {
        const rrInterval = now - this.lastPeakTime;
        this.rrIntervals.push(rrInterval);
        if (this.rrIntervals.length > 20) {
          this.rrIntervals.shift();
        }
      }
      this.lastPeakTime = now;
    }
    
    return {
      bpm: this.calculateBPM(),
      spo2: this.calculateSpO2(),
      ...this.estimateBloodPressure(),
      ...this.detectArrhythmia()
    };
  }

  private extractChannels(imageData: ImageData): { redChannel: number[], infraredChannel: number[] } {
    const redValues = [];
    const infraredValues = [];
    
    for (let i = 0; i < imageData.data.length; i += 4) {
      redValues.push(imageData.data[i]); // Red channel
      infraredValues.push(imageData.data[i + 2]); // Blue channel as proxy for infrared
    }
    
    return { redChannel: redValues, infraredChannel: infraredValues };
  }

  private movingAverageFilter(values: number[]): number {
    if (values.length === 0) return 0;
    const windowSize = Math.min(this.movingAverageSize, values.length);
    const sum = values.slice(-windowSize).reduce((a, b) => a + b, 0);
    return sum / windowSize;
  }

  private calculateAverage(values: number[]): number {
    return values.reduce((sum, value) => sum + value, 0) / values.length;
  }

  private calculateBPM(): number {
    if (this.readings.length < this.windowSize) {
      return 0;
    }

    let peakCount = 0;
    const threshold = this.calculateDynamicThreshold();
    const minPeakDistance = Math.floor(this.samplingRate * 0.5);
    let lastPeakIndex = 0;
    
    for (let i = 1; i < this.readings.length - 1; i++) {
      if (this.isPeak(i, threshold) && 
          (peakCount === 0 || i - lastPeakIndex > minPeakDistance)) {
        peakCount++;
        lastPeakIndex = i;
      }
    }

    const duration = (this.readings[this.readings.length - 1].timestamp - this.readings[0].timestamp) / 1000;
    return Math.round((peakCount * 60) / duration);
  }

  private calculateSpO2(): number {
    if (this.redValues.length < this.windowSize || this.infraredValues.length < this.windowSize) {
      return 0;
    }

    const redAC = Math.max(...this.redValues) - Math.min(...this.redValues);
    const redDC = this.calculateAverage(this.redValues);
    const irAC = Math.max(...this.infraredValues) - Math.min(...this.infraredValues);
    const irDC = this.calculateAverage(this.infraredValues);

    const R = (redAC / redDC) / (irAC / irDC);
    let spo2 = Math.round(110 - 25 * R);
    spo2 = Math.min(100, Math.max(70, spo2));

    return spo2;
  }

  private estimateBloodPressure(): { systolic: number; diastolic: number } {
    if (this.readings.length < this.windowSize) {
      return { systolic: 0, diastolic: 0 };
    }

    // Estimate blood pressure using PPG features and calibration values
    const ppgAmplitude = Math.max(...this.readings.map(r => r.value)) - 
                        Math.min(...this.readings.map(r => r.value));
    
    // Simple estimation based on PPG amplitude and calibration
    const systolicVariation = (ppgAmplitude / 255) * 20; // Max variation of ±20 mmHg
    const diastolicVariation = systolicVariation * 0.6; // Typically varies less than systolic

    return {
      systolic: Math.round(this.systolicCalibration + systolicVariation),
      diastolic: Math.round(this.diastolicCalibration + diastolicVariation)
    };
  }

  private detectArrhythmia(): { hasArrhythmia: boolean; arrhythmiaType: string } {
    if (this.rrIntervals.length < 5) {
      return { hasArrhythmia: false, arrhythmiaType: 'Normal' };
    }

    // Calculate RR interval variability
    const rmssd = this.calculateRMSSD();
    const averageRR = this.calculateAverage(this.rrIntervals);
    
    // Detect arrhythmia based on RR interval variability
    if (rmssd > 150) { // High variability
      return { hasArrhythmia: true, arrhythmiaType: 'Atrial Fibrillation' };
    } else if (averageRR < 600) { // < 600ms between beats
      return { hasArrhythmia: true, arrhythmiaType: 'Tachycardia' };
    } else if (averageRR > 1200) { // > 1200ms between beats
      return { hasArrhythmia: true, arrhythmiaType: 'Bradycardia' };
    }

    return { hasArrhythmia: false, arrhythmiaType: 'Normal' };
  }

  private calculateRMSSD(): number {
    if (this.rrIntervals.length < 2) return 0;
    
    let sumSquaredDiff = 0;
    for (let i = 1; i < this.rrIntervals.length; i++) {
      const diff = this.rrIntervals[i] - this.rrIntervals[i - 1];
      sumSquaredDiff += diff * diff;
    }
    
    return Math.sqrt(sumSquaredDiff / (this.rrIntervals.length - 1));
  }

  private calculateDynamicThreshold(): number {
    const values = this.readings.map(r => r.value);
    const mean = this.calculateAverage(values);
    const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
    return mean + Math.sqrt(variance) * 0.5;
  }

  private isPeak(index: number, threshold: number): boolean {
    return (
      this.readings[index].value > threshold &&
      this.readings[index].value > this.readings[index - 1].value &&
      this.readings[index].value > this.readings[index + 1].value
    );
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }

  setBloodPressureCalibration(systolic: number, diastolic: number): void {
    this.systolicCalibration = systolic;
    this.diastolicCalibration = diastolic;
  }
}
