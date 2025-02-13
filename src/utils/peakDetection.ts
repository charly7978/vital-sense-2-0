
import { supabase } from "@/integrations/supabase/client";

/**
 * PeakDetector: Detector de picos en tiempo real para señal PPG
 * 
 * IMPORTANTE: Este detector trabaja ÚNICAMENTE con picos reales de la señal PPG.
 * No genera detecciones sintéticas. Cada pico detectado corresponde a un
 * latido real del corazón capturado a través de la cámara.
 */
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 200;
  private lastPeakTime = 0;
  private readonly bufferSize = 15;
  private readonly minAmplitude = 0.003;
  private readonly adaptiveRate = 0.35;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;
  private readonly maxBPM = 220;
  private readonly minBPM = 40;
  private lastPeakValues: number[] = [];
  private readonly peakMemory = 5;
  private readonly minPeakProminence = 0.05;

  constructor() {
    this.loadConfiguration();
  }

  private async loadConfiguration() {
    try {
      const { data: settings, error } = await supabase
        .from('peak_detection_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (settings) {
        Object.assign(this, {
          minPeakDistance: settings.min_distance,
          bufferSize: settings.buffer_size,
          minAmplitude: settings.min_amplitude,
          maxBPM: settings.max_bpm,
          minBPM: settings.min_bpm,
          peakMemory: settings.peak_memory
        });

        console.log('Configuración de detección de picos cargada:', settings);
      }
    } catch (error) {
      console.error('Error cargando configuración de picos:', error);
    }
  }

  detectPeak(signal: number[], peakThreshold: number = 1.0): boolean {
    if (signal.length < 5) return false;

    const current = signal[signal.length - 1];
    const prev1 = signal[signal.length - 2];
    const prev2 = signal[signal.length - 3];
    const prev3 = signal[signal.length - 4];
    const prev4 = signal[signal.length - 5];

    // Calcular diferencias usando más puntos
    const diff1 = prev1 - current;
    const diff2 = prev1 - prev2;
    const diff3 = prev2 - prev3;
    const diff4 = prev3 - prev4;

    // Un pico debe tener una forma específica pero con criterios más flexibles
    const isPotentialPeak = 
      diff1 > 0 && 
      (diff2 > 0 || Math.abs(diff2) < 0.001) && // Más tolerante con la pendiente
      (diff3 < 0 || Math.abs(diff3) < 0.001) && // Más tolerante con la pendiente
      Math.abs(diff1) > this.minPeakProminence; // Menor exigencia de prominencia

    if (isPotentialPeak) {
      const now = Date.now();
      
      if (now - this.lastPeakTime < this.minPeakDistance) {
        return false;
      }

      // Calcular umbral adaptativo con más tolerancia
      if (this.peakBuffer.length > 0) {
        const avgPeak = this.peakBuffer.reduce((a, b) => a + b, 0) / this.peakBuffer.length;
        this.adaptiveThreshold = avgPeak * 0.5; // Reducido para ser más sensible
      } else {
        this.adaptiveThreshold = Math.max(current * 0.3, this.minAmplitude);
      }

      if (prev1 > this.adaptiveThreshold) {
        this.peakBuffer.push(prev1);
        this.timeBuffer.push(now);
        
        if (this.peakBuffer.length > this.bufferSize) {
          this.peakBuffer.shift();
          this.timeBuffer.shift();
        }

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
