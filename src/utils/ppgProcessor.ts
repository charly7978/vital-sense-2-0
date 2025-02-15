
import { PeakDetector } from './peakDetection';

export class PPGProcessor {
  private peakDetector = new PeakDetector();
  private bpmHistory: number[] = [];
  private readonly historySize = 5;
  private lastBPM = 0;
  private signalStrength = 1; // Factor de ajuste de sensibilidad dinámico

  processSignal(signal: number[], timestamp: number): number {
    if (signal.length === 0) return this.lastBPM;

    // Ajuste de sensibilidad basado en la señal detectada
    this.signalStrength = Math.max(0.5, Math.min(1.5, signal.reduce((a, b) => a + b, 0) / signal.length));

    const detected = this.peakDetector.detectPeak(signal.map(val => val * this.signalStrength), timestamp);
    
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
