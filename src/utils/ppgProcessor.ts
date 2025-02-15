
import { PeakDetector } from './peakDetection';
import { SignalFilter } from './signalFilter';

export class PPGProcessor {
  private peakDetector = new PeakDetector();
  private signalFilter = new SignalFilter();
  private bpmHistory: number[] = [];
  private readonly MAX_HISTORY = 10;
  private lastBPM = 0;
  private lastValidTimestamp = 0;
  private readonly MIN_QUALITY = 0.3;
  private readonly BPM_RANGE = { min: 40, max: 200 };

  processSignal(signal: number[], timestamp: number, quality: number): number {
    if (!this.isValidSignal(signal, quality)) {
      console.log('⚠️ Señal inválida:', { 
        longitud: signal.length, 
        calidad: quality 
      });
      return this.lastBPM;
    }

    const filteredSignal = this.signalFilter.filterSignal(signal);
    const peakDetected = this.peakDetector.detectPeak(filteredSignal, timestamp);

    if (peakDetected) {
      const instantBPM = this.calculateInstantBPM(timestamp);
      
      if (this.isValidBPM(instantBPM)) {
        this.updateBPMHistory(instantBPM);
        this.lastBPM = Math.round(this.calculateWeightedBPM());
        this.lastValidTimestamp = timestamp;

        console.log('💓 BPM actualizado:', {
          instantaneo: instantBPM,
          promedio: this.lastBPM,
          historial: this.bpmHistory
        });
      }
    }

    return this.lastBPM;
  }

  private isValidSignal(signal: number[], quality: number): boolean {
    return signal.length > 0 && quality >= this.MIN_QUALITY;
  }

  private calculateInstantBPM(timestamp: number): number {
    const interval = timestamp - this.lastValidTimestamp;
    return 60000 / interval;
  }

  private isValidBPM(bpm: number): boolean {
    return bpm >= this.BPM_RANGE.min && bpm <= this.BPM_RANGE.max;
  }

  private updateBPMHistory(bpm: number): void {
    this.bpmHistory.push(bpm);
    if (this.bpmHistory.length > this.MAX_HISTORY) {
      this.bpmHistory.shift();
    }
  }

  private calculateWeightedBPM(): number {
    if (this.bpmHistory.length === 0) return 0;

    let weightedSum = 0;
    let weightSum = 0;

    this.bpmHistory.forEach((bpm, index) => {
      const weight = Math.pow(1.2, index);
      weightedSum += bpm * weight;
      weightSum += weight;
    });

    return weightedSum / weightSum;
  }

  reset(): void {
    this.bpmHistory = [];
    this.lastBPM = 0;
    this.lastValidTimestamp = 0;
    this.signalFilter.reset();
    this.peakDetector.reset();
  }
}
