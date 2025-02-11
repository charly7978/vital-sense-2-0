import { VitalReading } from './types';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private lastProcessedTime: number = 0;
  private readonly samplingRate = 30; // 30 fps
  private readonly windowSize = 300; // 10 seconds at 30fps
  private readonly movingAverageSize = 5;
  private redValues: number[] = [];
  private infraredValues: number[] = [];

  processFrame(imageData: ImageData): { bpm: number; spo2: number } {
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
    
    const averageRed = this.calculateAverage(filteredRed);
    this.readings.push({ timestamp: now, value: averageRed });
    
    // Keep only the last 10 seconds of readings
    if (this.readings.length > this.windowSize) {
      this.readings = this.readings.slice(-this.windowSize);
    }
    
    return {
      bpm: this.calculateBPM(),
      spo2: this.calculateSpO2()
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

    // Improved peak detection with dynamic threshold
    let peakCount = 0;
    const threshold = this.calculateDynamicThreshold();
    const minPeakDistance = Math.floor(this.samplingRate * 0.5); // Minimum 0.5s between peaks
    let lastPeakIndex = 0;
    
    for (let i = 1; i < this.readings.length - 1; i++) {
      if (this.isPeak(i, threshold) && 
          (peakCount === 0 || i - lastPeakIndex > minPeakDistance)) {
        peakCount++;
        lastPeakIndex = i;
      }
    }

    // Calculate BPM based on peak count and time window
    const duration = (this.readings[this.readings.length - 1].timestamp - this.readings[0].timestamp) / 1000;
    return Math.round((peakCount * 60) / duration);
  }

  private calculateSpO2(): number {
    if (this.redValues.length < this.windowSize || this.infraredValues.length < this.windowSize) {
      return 0;
    }

    // Calculate AC and DC components for both red and infrared signals
    const redAC = Math.max(...this.redValues) - Math.min(...this.redValues);
    const redDC = this.calculateAverage(this.redValues);
    const irAC = Math.max(...this.infraredValues) - Math.min(...this.infraredValues);
    const irDC = this.calculateAverage(this.infraredValues);

    // Calculate R value (ratio of ratios)
    const R = (redAC / redDC) / (irAC / irDC);

    // Empirical formula for SpO2 calculation
    // SpO2 = 110 - 25R (simplified empirical formula, actual medical devices use calibrated curves)
    let spo2 = Math.round(110 - 25 * R);
    
    // Clamp values to physiological range
    spo2 = Math.min(100, Math.max(70, spo2));

    return spo2;
  }

  private calculateDynamicThreshold(): number {
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
