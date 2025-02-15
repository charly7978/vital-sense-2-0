
import { PeakDetector } from './peakDetection';

export class PPGProcessor {
  private peakDetector = new PeakDetector();
  private bpmHistory: number[] = [];
  private readonly historySize = 5;
  private lastBPM = 0;

  processSignal(signal: number[], timestamp: number): number {
    const detected = this.peakDetector.detectPeak(signal, timestamp);
    
    if (detected) {
      const bpm = 60000 / (timestamp - this.peakDetector.lastPeakTime);
      if (bpm > 40 && bpm < 200) {
        this.bpmHistory.push(bpm);
        if (this.bpmHistory.length > this.historySize) {
          this.bpmHistory.shift();
        }
        this.lastBPM = this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length;
      }
    }

    return this.lastBPM;
  }
}
