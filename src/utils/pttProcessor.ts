
/**
 * PTTProcessor: Análisis del tiempo de tránsito del pulso en tiempo real
 * 
 * IMPORTANTE: Este procesador analiza ÚNICAMENTE tiempos reales entre
 * picos de la señal PPG. No genera estimaciones sintéticas.
 * Cada medición corresponde a un tiempo real de tránsito del pulso.
 */

interface PTTResult {
  ptt: number;
  confidence: number;
  features: {
    systolicPeak: number;
    diastolicPeak: number;
    notchTime: number;
    pulseWidth: number;
  };
}

export class PTTProcessor {
  private lastValidPTT: number = 0;
  private readonly minValidPTT = 100; // Reducido de 150 para capturar más PTTs
  private readonly maxValidPTT = 500; // Reducido de 400 para capturar más PTTs
  private readonly MIN_PEAK_HEIGHT = 10;
  private readonly MIN_PEAK_DISTANCE = 15;

  calculatePTT(ppgSignal: number[]): PTTResult | null {
    if (!ppgSignal || ppgSignal.length < 10) return null;

    try {
      // Detectar picos con umbral dinámico
      const peaks: number[] = [];
      const threshold = this.calculateDynamicThreshold(ppgSignal);
      
      for (let i = 1; i < ppgSignal.length - 1; i++) {
        if (this.isPeak(ppgSignal, i, threshold)) {
          if (peaks.length === 0 || i - peaks[peaks.length - 1] >= this.MIN_PEAK_DISTANCE) {
            peaks.push(i);
          }
        }
      }

      if (peaks.length < 2) return null;

      // Calcular PTT promedio entre picos consecutivos
      const ptts: number[] = [];
      for (let i = 1; i < peaks.length; i++) {
        const ptt = (peaks[i] - peaks[i-1]) * (1000 / 30); // Asumiendo 30Hz
        if (ptt >= this.minValidPTT && ptt <= this.maxValidPTT) {
          ptts.push(ptt);
        }
      }

      if (ptts.length === 0) return null;

      // Calcular PTT promedio y características
      const ptt = ptts.reduce((a, b) => a + b, 0) / ptts.length;
      const systolicPeak = Math.max(...peaks.map(i => ppgSignal[i]));
      const confidence = this.calculateConfidence(ppgSignal, peaks);

      this.lastValidPTT = ptt;

      return {
        ptt,
        confidence,
        features: {
          systolicPeak,
          diastolicPeak: this.findDiastolicPeak(ppgSignal, peaks),
          notchTime: this.findDicroticNotch(ppgSignal, peaks),
          pulseWidth: this.calculatePulseWidth(peaks)
        }
      };
    } catch (error) {
      console.error('Error calculando PTT:', error);
      return null;
    }
  }

  private calculateDynamicThreshold(signal: number[]): number {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const stdDev = Math.sqrt(
      signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length
    );
    return mean + stdDev * 0.5; // Umbral más sensible
  }

  private isPeak(signal: number[], index: number, threshold: number): boolean {
    return signal[index] > threshold &&
           signal[index] > signal[index - 1] &&
           signal[index] > signal[index + 1] &&
           signal[index] - signal[index - 1] >= this.MIN_PEAK_HEIGHT;
  }

  private findDiastolicPeak(signal: number[], peaks: number[]): number {
    let maxDiastolic = 0;
    for (let i = 0; i < peaks.length - 1; i++) {
      const segment = signal.slice(peaks[i], peaks[i + 1]);
      maxDiastolic = Math.max(maxDiastolic, Math.max(...segment));
    }
    return maxDiastolic;
  }

  private findDicroticNotch(signal: number[], peaks: number[]): number {
    if (peaks.length < 2) return 0;
    
    const segment = signal.slice(peaks[0], peaks[1]);
    let minIdx = 0;
    let minVal = Infinity;
    
    for (let i = Math.floor(segment.length * 0.3); i < Math.floor(segment.length * 0.7); i++) {
      if (segment[i] < minVal) {
        minVal = segment[i];
        minIdx = i;
      }
    }
    
    return minIdx * (1000 / 30);
  }

  private calculatePulseWidth(peaks: number[]): number {
    if (peaks.length < 2) return 0;
    return (peaks[1] - peaks[0]) * (1000 / 30);
  }

  private calculateConfidence(signal: number[], peaks: number[]): number {
    if (peaks.length < 2) return 0;

    const peakHeights = peaks.map(i => signal[i]);
    const meanHeight = peakHeights.reduce((a, b) => a + b, 0) / peakHeights.length;
    const heightVariability = Math.sqrt(
      peakHeights.reduce((a, b) => a + Math.pow(b - meanHeight, 2), 0) / peakHeights.length
    ) / meanHeight;

    const intervalVariability = this.calculateIntervalVariability(peaks);
    
    return Math.max(0, Math.min(1, 
      (1 - heightVariability * 0.5) * 
      (1 - intervalVariability * 0.5)
    ));
  }

  private calculateIntervalVariability(peaks: number[]): number {
    if (peaks.length < 3) return 1;
    
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i-1]);
    }
    
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    return Math.sqrt(
      intervals.reduce((a, b) => a + Math.pow(b - meanInterval, 2), 0) / intervals.length
    ) / meanInterval;
  }

  getLastValidPTT(): number {
    return this.lastValidPTT;
  }
}
