
/**
 * PeakDetector: Detector de picos en tiempo real para señal PPG
 * 
 * IMPORTANTE: Este detector trabaja ÚNICAMENTE con picos reales de la señal PPG.
 * No genera detecciones sintéticas. Cada pico detectado corresponde a un
 * latido real del corazón capturado a través de la cámara.
 */
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 180;
  private lastPeakTime = 0;
  private readonly bufferSize = 15;
  private readonly minAmplitude = 0.002;
  private readonly adaptiveRate = 0.35;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;
  private readonly maxBPM = 250;
  private readonly minBPM = 30;
  private lastPeakValues: number[] = [];
  private readonly peakMemory = 5;

  detectPeak(signal: number[], peakThreshold: number = 1.0): boolean {
    if (signal.length < 3) return false;

    // Obtener el valor actual y los dos anteriores
    const current = signal[signal.length - 1];
    const prev1 = signal[signal.length - 2];
    const prev2 = signal[signal.length - 3];

    // Calcular diferencias
    const diff1 = prev1 - current;
    const diff2 = prev1 - prev2;

    // Un pico ocurre cuando ambas diferencias son positivas (pico local)
    const isPotentialPeak = diff1 > 0 && diff2 > 0;

    if (isPotentialPeak) {
      const now = Date.now();
      
      // Validar intervalo mínimo entre picos
      if (now - this.lastPeakTime < this.minPeakDistance) {
        return false;
      }

      // Calcular umbral adaptativo basado en picos previos
      if (this.peakBuffer.length > 0) {
        const avgPeak = this.peakBuffer.reduce((a, b) => a + b, 0) / this.peakBuffer.length;
        this.adaptiveThreshold = avgPeak * 0.4; // Reducido significativamente para mayor sensibilidad
      } else {
        // Umbral inicial más bajo para comenzar a detectar
        this.adaptiveThreshold = Math.max(current * 0.3, this.minAmplitude);
      }

      // Validar que el pico supere el umbral
      if (prev1 > this.adaptiveThreshold) {
        // Actualizar buffers
        this.peakBuffer.push(prev1);
        this.timeBuffer.push(now);
        
        // Mantener tamaño del buffer
        if (this.peakBuffer.length > this.bufferSize) {
          this.peakBuffer.shift();
          this.timeBuffer.shift();
        }

        // Validar BPM resultante si tenemos suficientes datos
        if (this.timeBuffer.length >= 2) {
          const interval = this.timeBuffer[this.timeBuffer.length - 1] - this.timeBuffer[this.timeBuffer.length - 2];
          const bpm = 60000 / interval;
          
          if (bpm < this.minBPM || bpm > this.maxBPM) {
            return false;
          }
        }

        this.lastPeakTime = now;
        
        console.log('Pico válido detectado:', {
          valor: prev1,
          umbral: this.adaptiveThreshold,
          intervalo: now - this.lastPeakTime,
          bufferSize: this.peakBuffer.length,
          diff1,
          diff2
        });

        return true;
      }
    }

    return false;
  }

  private calculateMovingAverage(values: number[]): number {
    return values.reduce((a, b) => a + b, 0) / values.length;
  }
}
