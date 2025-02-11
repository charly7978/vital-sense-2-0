import { VitalReading } from './types';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private lastProcessedTime: number = 0;
  private readonly samplingRate = 30; // 30 fps
  private readonly windowSize = 300; // 10 seconds at 30fps

  processFrame(imageData: ImageData): number {
    const now = Date.now();
    const redChannel = this.extractRedChannel(imageData);
    const averageRed = this.calculateAverageRed(redChannel);
    
    this.readings.push({ timestamp: now, value: averageRed });
    
    // Keep only the last 10 seconds of readings
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }
    
    return this.calculateBPM();
  }

  private extractRedChannel(imageData: ImageData): number[] {
    const redValues = [];
    for (let i = 0; i < imageData.data.length; i += 4) {
      redValues.push(imageData.data[i]);
    }
    return redValues;
  }

  private calculateAverageRed(redValues: number[]): number {
    return redValues.reduce((sum, value) => sum + value, 0) / redValues.length;
  }

  private calculateBPM(): number {
    if (this.readings.length < this.windowSize) {
      return 0;
    }

    // Simple peak detection algorithm
    let peakCount = 0;
    const threshold = this.calculateThreshold();
    
    for (let i = 1; i < this.readings.length - 1; i++) {
      if (this.isPeak(i, threshold)) {
        peakCount++;
      }
    }

    // Calculate BPM based on peak count
    const duration = (this.readings[this.readings.length - 1].timestamp - this.readings[0].timestamp) / 1000;
    return Math.round((peakCount * 60) / duration);
  }

  private calculateThreshold(): number {
    const values = this.readings.map(r => r.value);
    const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
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
}
