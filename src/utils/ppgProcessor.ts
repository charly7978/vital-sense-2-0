
import { PeakDetector } from './peakDetection';

export class PPGProcessor {
  private peakDetector = new PeakDetector();
  private bpmHistory: number[] = [];
  private readonly historySize = 5;
  private lastBPM = 0;
  private signalStrength = 1;

  processSignal(signal: number[], timestamp: number): number {
    if (signal.length === 0) {
      console.log('❌ Señal vacía recibida');
      return this.lastBPM;
    }

    this.signalStrength = Math.max(0.5, Math.min(1.5, signal.reduce((a, b) => a + b, 0) / signal.length));
    
    console.log('🔍 Procesamiento de señal PPG:', {
      señalOriginal: signal,
      intensidadSeñal: this.signalStrength,
      historialBPM: this.bpmHistory,
      ultimoBPM: this.lastBPM,
      timestamp
    });

    const adjustedSignal = signal.map(val => val * this.signalStrength);
    const detected = this.peakDetector.detectPeak(adjustedSignal, timestamp);
    
    if (detected) {
      const timeSinceLastPeak = this.peakDetector.getTimeSinceLastPeak(timestamp);
      const bpm = 60000 / timeSinceLastPeak;
      
      console.log('💓 Detección de pico:', {
        tiempoDesdeUltimoPico: timeSinceLastPeak,
        bpmCalculado: bpm,
        señalAjustada: adjustedSignal
      });

      if (bpm > 40 && bpm < 200) {
        this.bpmHistory.push(bpm);
        if (this.bpmHistory.length > this.historySize) {
          this.bpmHistory.shift();
        }
        this.lastBPM = this.bpmHistory.reduce((a, b) => a + b, 0) / this.bpmHistory.length;
        
        console.log('✅ BPM actualizado:', {
          bpmPromedio: this.lastBPM,
          historialBPM: this.bpmHistory
        });
      } else {
        console.log('⚠️ BPM fuera de rango:', bpm);
      }
    }

    return this.lastBPM;
  }
}
