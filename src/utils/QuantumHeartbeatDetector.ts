
import { SignalFilter } from './signalFilter';

export class QuantumHeartbeatDetector {
  private readonly sampleRate: number = 30;
  private readonly windowSize: number = 128;
  private readonly minPeakDistance: number = Math.floor(0.3 * 30); // 300ms en frames
  private readonly maxPeakDistance: number = Math.floor(2.0 * 30);  // 2s en frames
  private readonly signalFilter: SignalFilter;
  private lastPeakIndex: number = -1;
  private readonly noiseThreshold: number = 0.2;
  private readonly minSignalQuality: number = 0.4;

  private readonly buffer: number[] = [];
  private readonly qualityBuffer: number[] = [];
  private readonly peakBuffer: number[] = [];
  private readonly intervalBuffer: number[] = [];

  constructor() {
    this.signalFilter = new SignalFilter(this.sampleRate);
  }

  addSample(value: number, quality: number) {
    this.buffer.push(value);
    this.qualityBuffer.push(quality);

    if (this.buffer.length > this.windowSize) {
      this.buffer.shift();
      this.qualityBuffer.shift();
    }
  }

  detectHeartbeat(): boolean {
    if (this.buffer.length < this.windowSize) {
      return false;
    }

    // Aplicar filtros avanzados
    const filtered = this.signalFilter.lowPassFilter(this.buffer, 4);
    
    // Análisis wavelet para mejorar la detección de picos
    const wavelets = this.waveletTransform(filtered);
    
    // Calcular umbral adaptativo
    const threshold = this.calculateAdaptiveThreshold(wavelets);
    
    // Análisis de calidad y estabilidad
    const signalQuality = this.analyzeSignalQuality();
    if (signalQuality < this.minSignalQuality) {
      console.log('❌ Calidad de señal insuficiente:', signalQuality.toFixed(2));
      return false;
    }

    // Detección de pico con validación múltiple
    const isPeak = this.validatePeak(wavelets, threshold);
    
    if (isPeak) {
      this.updatePeakHistory();
      return true;
    }

    return false;
  }

  private waveletTransform(signal: number[]): number[] {
    const result: number[] = [];
    const waveletWidth = 10;
    
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
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const stdDev = Math.sqrt(
      signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length
    );
    
    // Umbral adaptativo basado en estadísticas de la señal
    return mean + 1.5 * stdDev;
  }

  private validatePeak(signal: number[], threshold: number): boolean {
    const currentIndex = signal.length - 1;
    
    // Verificar distancia desde último pico
    if (this.lastPeakIndex >= 0) {
      const distance = currentIndex - this.lastPeakIndex;
      if (distance < this.minPeakDistance) {
        return false;
      }
      if (distance > this.maxPeakDistance) {
        this.resetPeakDetection();
      }
    }

    // Verificar si es máximo local
    const isLocalMax = this.isLocalMaximum(signal, currentIndex);
    if (!isLocalMax) return false;

    // Verificar amplitud y forma
    const amplitude = signal[currentIndex];
    if (amplitude < threshold) return false;

    // Verificar patrón de latido
    const hasHeartbeatPattern = this.validateHeartbeatPattern(signal, currentIndex);
    if (!hasHeartbeatPattern) return false;

    return true;
  }

  private isLocalMaximum(signal: number[], index: number): boolean {
    const window = 3;
    for (let i = Math.max(0, index - window); i <= Math.min(signal.length - 1, index + window); i++) {
      if (i !== index && signal[i] >= signal[index]) {
        return false;
      }
    }
    return true;
  }

  private validateHeartbeatPattern(signal: number[], index: number): boolean {
    // Verificar patrón característico de subida rápida y bajada gradual
    const windowBefore = signal.slice(Math.max(0, index - 5), index);
    const windowAfter = signal.slice(index + 1, Math.min(signal.length, index + 6));

    let increasing = 0;
    let decreasing = 0;

    // Contar muestras crecientes antes del pico
    for (let i = 1; i < windowBefore.length; i++) {
      if (windowBefore[i] > windowBefore[i-1]) increasing++;
    }

    // Contar muestras decrecientes después del pico
    for (let i = 1; i < windowAfter.length; i++) {
      if (windowAfter[i] < windowAfter[i-1]) decreasing++;
    }

    // Verificar que haya suficiente subida y bajada
    return increasing >= 2 && decreasing >= 3;
  }

  private analyzeSignalQuality(): number {
    if (this.qualityBuffer.length < this.windowSize) {
      return 0;
    }

    // Calcular estadísticas de calidad
    const recentQualities = this.qualityBuffer.slice(-30);
    const meanQuality = recentQualities.reduce((a, b) => a + b, 0) / recentQualities.length;
    
    // Calcular estabilidad
    const variance = recentQualities.reduce((a, b) => a + Math.pow(b - meanQuality, 2), 0) / recentQualities.length;
    const stability = Math.exp(-variance);

    // Combinar métricas de calidad
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

  private resetPeakDetection() {
    this.lastPeakIndex = -1;
    this.peakBuffer.length = 0;
    this.intervalBuffer.length = 0;
  }

  getCurrentBPM(): number {
    if (this.intervalBuffer.length < 2) return 0;
    
    // Calcular BPM usando la mediana de intervalos
    const sortedIntervals = [...this.intervalBuffer].sort((a, b) => a - b);
    const medianInterval = sortedIntervals[Math.floor(sortedIntervals.length / 2)];
    
    return Math.round(60000 / medianInterval); // Convertir ms a BPM
  }
}
