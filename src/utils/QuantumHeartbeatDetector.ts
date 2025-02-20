
import { SignalFilter } from './signalFilter';

export class QuantumHeartbeatDetector {
  private readonly sampleRate: number = 30;
  private readonly windowSize: number = 64; // Reducido para mayor sensibilidad
  private readonly minPeakDistance: number = Math.floor(0.3 * 30); // 300ms mínimo entre latidos
  private readonly maxPeakDistance: number = Math.floor(2.0 * 30); // 2s máximo entre latidos
  private readonly signalFilter: SignalFilter;
  private lastPeakIndex: number = -1;
  private readonly noiseThreshold: number = 0.15; // Reducido para mayor sensibilidad
  private readonly minSignalQuality: number = 0.3; // Reducido umbral mínimo de calidad
  private readonly minAmplitude: number = 5; // Reducido para detectar cambios más sutiles

  private readonly buffer: number[] = [];
  private readonly qualityBuffer: number[] = [];
  private readonly peakBuffer: number[] = [];
  private readonly intervalBuffer: number[] = [];
  private lastPeakTime: number = 0;

  constructor() {
    this.signalFilter = new SignalFilter(this.sampleRate);
  }

  addSample(value: number, quality: number): boolean {
    // Normalizar el valor entre 0 y 1
    const normalizedValue = value / 255;
    this.buffer.push(normalizedValue);
    this.qualityBuffer.push(quality);

    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
      this.qualityBuffer.shift();
    }

    return this.detectHeartbeat();
  }

  private detectHeartbeat(): boolean {
    if (this.buffer.length < this.windowSize) {
      return false;
    }

    // Filtrar la señal para eliminar ruido
    const filtered = this.signalFilter.lowPassFilter(this.buffer, 4);
    
    // Aplicar transformada wavelet para detectar patrones de latido
    const wavelets = this.waveletTransform(filtered);
    
    // Calcular umbral adaptativo
    const threshold = this.calculateAdaptiveThreshold(wavelets);
    
    // Verificar calidad de la señal
    const signalQuality = this.analyzeSignalQuality();
    if (signalQuality < this.minSignalQuality) {
      return false;
    }

    const currentValue = wavelets[wavelets.length - 1];
    const now = Date.now();
    
    // Evitar detecciones demasiado cercanas
    if (now - this.lastPeakTime < 300) {
      return false;
    }

    // Validar si es un latido real
    if (this.validatePeak(wavelets, threshold)) {
      this.lastPeakTime = now;
      this.updatePeakHistory();
      console.log('✓ Latido detectado:', {
        valor: currentValue,
        umbral: threshold,
        calidad: signalQuality,
        bpm: this.getCurrentBPM()
      });
      return true;
    }

    return false;
  }

  private waveletTransform(signal: number[]): number[] {
    const result: number[] = [];
    const waveletWidth = 5; // Reducido para mayor sensibilidad
    
    for (let i = waveletWidth; i < signal.length - waveletWidth; i++) {
      let sum = 0;
      for (let j = 0; j < waveletWidth; j++) {
        sum += (signal[i + j] - signal[i - j]);
      }
      result.push(sum / waveletWidth);
    }
    
    return result;
  }

  private calculateAdaptiveThreshold(signal: number[]): number {
    if (signal.length === 0) return 0;
    
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const stdDev = Math.sqrt(
      signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length
    );
    
    return mean + stdDev; // Reducido de 1.5 * stdDev a 1.0 * stdDev
  }

  private validatePeak(signal: number[], threshold: number): boolean {
    const currentIndex = signal.length - 1;
    const currentValue = signal[currentIndex];

    // Verificar si supera el umbral mínimo
    if (currentValue < threshold || currentValue < this.minAmplitude) {
      return false;
    }

    // Verificar si es un máximo local
    if (!this.isLocalMaximum(signal, currentIndex)) {
      return false;
    }

    // Verificar patrón de latido
    return this.validateHeartbeatPattern(signal, currentIndex);
  }

  private isLocalMaximum(signal: number[], index: number): boolean {
    const window = 2; // Reducido para mayor sensibilidad
    for (let i = Math.max(0, index - window); i <= Math.min(signal.length - 1, index + window); i++) {
      if (i !== index && signal[i] >= signal[index]) {
        return false;
      }
    }
    return true;
  }

  private validateHeartbeatPattern(signal: number[], index: number): boolean {
    const windowBefore = signal.slice(Math.max(0, index - 3), index);
    const windowAfter = signal.slice(index + 1, Math.min(signal.length, index + 4));

    let increasing = 0;
    let decreasing = 0;

    for (let i = 1; i < windowBefore.length; i++) {
      if (windowBefore[i] > windowBefore[i-1]) increasing++;
    }

    for (let i = 1; i < windowAfter.length; i++) {
      if (windowAfter[i] < windowAfter[i-1]) decreasing++;
    }

    // Relajado los requisitos de validación
    return increasing >= 1 && decreasing >= 1;
  }

  private analyzeSignalQuality(): number {
    if (this.qualityBuffer.length < this.windowSize) {
      return 0;
    }

    const recentQualities = this.qualityBuffer.slice(-15); // Ventana más pequeña
    const meanQuality = recentQualities.reduce((a, b) => a + b, 0) / recentQualities.length;
    
    const variance = recentQualities.reduce((a, b) => a + Math.pow(b - meanQuality, 2), 0) / recentQualities.length;
    const stability = Math.exp(-variance);

    return meanQuality * stability;
  }

  private updatePeakHistory() {
    const currentIndex = this.buffer.length - 1;
    this.lastPeakIndex = currentIndex;
    
    const now = Date.now();
    this.peakBuffer.push(now);
    
    if (this.peakBuffer.length > 1) {
      const interval = now - this.peakBuffer[this.peakBuffer.length - 2];
      this.intervalBuffer.push(interval);
      
      if (this.intervalBuffer.length > 10) {
        this.intervalBuffer.shift();
      }
    }

    if (this.peakBuffer.length > 10) {
      this.peakBuffer.shift();
    }
  }

  getCurrentBPM(): number {
    if (this.intervalBuffer.length < 2) return 0;
    
    const validIntervals = this.intervalBuffer.filter(interval => 
      interval >= 300 && interval <= 2000
    );

    if (validIntervals.length < 2) return 0;
    
    const sortedIntervals = [...validIntervals].sort((a, b) => a - b);
    const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
    
    const bpm = Math.round(60000 / medianInterval);
    return bpm >= 30 && bpm <= 200 ? bpm : 0;
  }
}
