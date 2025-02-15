
import { PeakDetector } from './peakDetection';
import { SignalFilter } from './signalFilter';

export class PPGProcessor {
  private peakDetector = new PeakDetector();
  private signalFilter = new SignalFilter();
  private bpmHistory: number[] = [];
  private readonly historySize = 10;
  private lastBPM = 0;
  private lastValidTimestamp = 0;
  private readonly MIN_QUALITY_THRESHOLD = 0.3;

  processSignal(signal: number[], timestamp: number, quality: number): number {
    if (signal.length === 0 || quality < this.MIN_QUALITY_THRESHOLD) {
      console.log('❌ Señal insuficiente:', {
        longitudSeñal: signal.length,
        calidad: quality,
        umbralMinimo: this.MIN_QUALITY_THRESHOLD
      });
      return this.lastBPM;
    }

    // Filtrar señal
    const filteredSignal = this.signalFilter.filterSignal(signal);
    
    console.log('🔍 Señal procesada:', {
      señalOriginal: signal,
      señalFiltrada: filteredSignal,
      calidad,
      timestamp
    });

    // Detectar picos
    const detected = this.peakDetector.detectPeak(filteredSignal, timestamp);
    
    if (detected) {
      const timeSinceLastPeak = timestamp - this.lastValidTimestamp;
      const instantBPM = 60000 / timeSinceLastPeak;
      
      console.log('💓 Pico detectado:', {
        tiempoDesdeUltimoPico: timeSinceLastPeak,
        bpmInstantaneo: instantBPM
      });

      if (instantBPM >= 40 && instantBPM <= 200) {
        this.bpmHistory.push(instantBPM);
        if (this.bpmHistory.length > this.historySize) {
          this.bpmHistory.shift();
        }

        // Calcular BPM promedio con pesos
        const weightedBPM = this.calculateWeightedBPM();
        this.lastBPM = Math.round(weightedBPM);
        this.lastValidTimestamp = timestamp;

        console.log('✅ BPM actualizado:', {
          bpmPromedio: this.lastBPM,
          historial: this.bpmHistory
        });
      } else {
        console.log('⚠️ BPM fuera de rango:', instantBPM);
      }
    }

    return this.lastBPM;
  }

  private calculateWeightedBPM(): number {
    if (this.bpmHistory.length === 0) return 0;

    let weightedSum = 0;
    let weightSum = 0;
    
    this.bpmHistory.forEach((bpm, index) => {
      const weight = Math.pow(1.2, index); // Dar más peso a las mediciones más recientes
      weightedSum += bpm * weight;
      weightSum += weight;
    });

    return weightedSum / weightSum;
  }
}
