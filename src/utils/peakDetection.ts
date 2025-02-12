
/**
 * PeakDetector: Detector de picos en tiempo real para señal PPG
 * 
 * IMPORTANTE: Este detector trabaja ÚNICAMENTE con picos reales de la señal PPG.
 * No genera detecciones sintéticas. Cada pico detectado corresponde a un
 * latido real del corazón capturado a través de la cámara.
 */
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 250; // Aumentado de 180 a 250ms para evitar falsos positivos
  private lastPeakTime = 0;
  private readonly bufferSize = 15;
  private readonly minAmplitude = 0.005; // Aumentado para exigir picos más claros
  private readonly adaptiveRate = 0.35;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;
  private readonly maxBPM = 220;
  private readonly minBPM = 40;
  private lastPeakValues: number[] = [];
  private readonly peakMemory = 5;
  private readonly minPeakProminence = 0.1; // Nuevo: mínima diferencia con valores circundantes

  detectPeak(signal: number[], peakThreshold: number = 1.0): boolean {
    if (signal.length < 5) return false; // Aumentado de 3 a 5 para mejor contexto

    // Obtener más contexto alrededor del punto analizado
    const current = signal[signal.length - 1];
    const prev1 = signal[signal.length - 2];
    const prev2 = signal[signal.length - 3];
    const prev3 = signal[signal.length - 4]; // Nuevo: más contexto
    const prev4 = signal[signal.length - 5]; // Nuevo: más contexto

    // Calcular diferencias usando más puntos
    const diff1 = prev1 - current;
    const diff2 = prev1 - prev2;
    const diff3 = prev2 - prev3; // Nueva diferencia
    const diff4 = prev3 - prev4; // Nueva diferencia

    // Un pico debe tener una forma específica
    const isPotentialPeak = diff1 > 0 && diff2 > 0 && 
                           diff3 < 0 && diff4 < 0 && // Nueva condición: forma más clara
                           Math.abs(diff1) > this.minPeakProminence; // Nueva condición: prominencia

    if (isPotentialPeak) {
      const now = Date.now();
      
      // Validar intervalo mínimo entre picos
      if (now - this.lastPeakTime < this.minPeakDistance) {
        return false;
      }

      // Calcular umbral adaptativo basado en picos previos
      if (this.peakBuffer.length > 0) {
        const avgPeak = this.peakBuffer.reduce((a, b) => a + b, 0) / this.peakBuffer.length;
        this.adaptiveThreshold = avgPeak * 0.6; // Aumentado de 0.4 a 0.6 para ser más exigente
      } else {
        this.adaptiveThreshold = Math.max(current * 0.4, this.minAmplitude);
      }

      // Validar que el pico supere el umbral y tenga suficiente amplitud
      if (prev1 > this.adaptiveThreshold && 
          Math.abs(prev1 - Math.min(current, prev2)) > this.minAmplitude) {
        
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
          const interval = this.timeBuffer[this.timeBuffer.length - 1] - 
                          this.timeBuffer[this.timeBuffer.length - 2];
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
