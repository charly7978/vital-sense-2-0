
import { VitalReading } from './types';

export class PPGDataManager {
  private lastCleanupTime: number = 0;
  private readonly cleanupInterval: number = 2000;

  cleanupData(
    readings: VitalReading[],
    redBuffer: number[],
    irBuffer: number[],
    peakTimes: number[],
    signalBuffer: number[],
    windowSize: number,
    bufferSize: number
  ): void {
    const now = Date.now();
    
    if (now - this.lastCleanupTime < this.cleanupInterval) {
      return;
    }
    
    this.lastCleanupTime = now;
    const maxAge = 10000;

    try {
      if (readings.length > 0) {
        const recentReadings = readings.filter(reading => now - reading.timestamp < maxAge);
        readings.length = 0;
        readings.push(...recentReadings);
      }

      if (redBuffer.length > windowSize) {
        const newBuffer = redBuffer.slice(-windowSize);
        redBuffer.length = 0;
        redBuffer.push(...newBuffer);
      }
      
      if (irBuffer.length > windowSize) {
        const newBuffer = irBuffer.slice(-windowSize);
        irBuffer.length = 0;
        irBuffer.push(...newBuffer);
      }
      
      if (peakTimes.length > 5) {
        const newPeakTimes = peakTimes.slice(-5);
        peakTimes.length = 0;
        peakTimes.push(...newPeakTimes);
      }
      
      if (signalBuffer.length > bufferSize) {
        const newBuffer = signalBuffer.slice(-bufferSize);
        signalBuffer.length = 0;
        signalBuffer.push(...newBuffer);
      }
    } catch (error) {
      console.error('Error durante la limpieza de datos:', error);
    }
  }
}
