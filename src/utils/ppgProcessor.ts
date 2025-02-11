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

    // Detect peaks and play beep
    if (this.readings.length > 2) {
      const currentReading = this.readings[this.readings.length - 1];
      const prevReading = this.readings[this.readings.length - 2];
      
      if (this.isPeak(currentReading.value, prevReading.value)) {
        this.beepPlayer.playBeep();
        this.lastPeakTime = now;
      }
    }

    // Calculate vitals
    const bpm = this.calculateBPM();
    
    return {
      bpm: Math.round(bpm),
      spo2: 95 + Math.random() * 3, // This needs real implementation
      systolic: 120, // This needs real implementation
      diastolic: 80, // This needs real implementation
      hasArrhythmia: false,
      arrhythmiaType: 'Normal'
    };
  }

  private extractRedChannelAverage(imageData: ImageData): number {
    let redSum = 0;
    let pixelCount = 0;
    
    // Only process the center region of the image
    const width = imageData.width;
    const height = imageData.height;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = 50; // pixels
    
    for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
      for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
        if (x >= 0 && x < width && y >= 0 && y < height) {
          const i = (y * width + x) * 4;
          redSum += imageData.data[i]; // Red channel
          pixelCount++;
        }
      }
    }
    
    return pixelCount > 0 ? redSum / pixelCount : 0;
  }

  private normalizeSignal(value: number): number {
    // Update baseline with moving average
    this.baseline = this.baseline * 0.95 + value * 0.05;
    
    // Normalize around baseline
    return value - this.baseline;
  }

  private isPeak(currentValue: number, prevValue: number): boolean {
    // Update adaptive threshold
    this.adaptiveThreshold = this.adaptiveThreshold * 0.95 + Math.abs(currentValue) * 0.05;
    
    // Peak detection with adaptive thresholding
    const threshold = this.adaptiveThreshold * 0.7;
    const now = Date.now();
    
    if (currentValue > threshold && 
        currentValue > prevValue && 
        now - this.lastPeakTime > 300) { // Minimum 300ms between peaks (200 BPM max)
      return true;
    }
    
    return false;
  }

  private calculateBPM(): number {
    if (this.readings.length < 2) return 0;
    
    const recentReadings = this.readings.slice(-60); // Last 2 seconds at 30fps
    let peakCount = 0;
    let lastPeakIndex = -1;
    
    for (let i = 1; i < recentReadings.length - 1; i++) {
      if (this.isPeak(recentReadings[i].value, recentReadings[i-1].value)) {
        peakCount++;
        lastPeakIndex = i;
      }
    }
    
    if (peakCount < 2) return 0;
    
    const timeSpan = (recentReadings[recentReadings.length - 1].timestamp - recentReadings[0].timestamp) / 1000;
    return (peakCount * 60) / timeSpan;
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }
}
