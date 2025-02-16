
export class PeakDetector {
  private adaptiveThreshold = 0;
  private readonly minPeakDistance = 300; // Reducido para permitir más latidos
  private lastPeakTime = 0;
  private readonly bufferSize = 30;
  private readonly minAmplitude = 0.1; // Reducido para mejor sensibilidad
  private readonly adaptiveRate = 0.2;
  private peakBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private frameCount = 0;
  private readonly MAX_BPM = 180;
  private readonly MIN_BPM = 40;

  isRealPeak(currentValue: number, now: number, signalBuffer: number[]): boolean {
    this.frameCount++;
    console.log('🔍 Analizando pico potencial:', {
      valor: currentValue,
      tiempo: now,
      ultimoPico: this.lastPeakTime
    });
    
    // Verificar si ha pasado suficiente tiempo desde el último pico
    const timeSinceLastPeak = now - this.lastPeakTime;
    const minTimeGap = (60 / this.MAX_BPM) * 1000;
    const maxTimeGap = (60 / this.MIN_BPM) * 1000;

    console.log('⏱️ Intervalos:', {
      tiempoDesdeUltimoPico: timeSinceLastPeak,
      intervaloMinimo: minTimeGap,
      intervaloMaximo: maxTimeGap
    });

    if (timeSinceLastPeak < minTimeGap) {
      console.log('⚠️ Muy poco tiempo desde el último pico');
      return false;
    }

    if (signalBuffer.length < 8) {
      console.log('⚠️ Buffer de señal insuficiente');
      return false;
    }

    // Análisis de señal mejorado
    const recentValues = signalBuffer.slice(-this.bufferSize);
    const avgValue = recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const stdDev = Math.sqrt(
      recentValues.reduce((a, b) => a + Math.pow(b - avgValue, 2), 0) / recentValues.length
    );

    console.log('📊 Estadísticas de señal:', {
      promedio: avgValue,
      desviacionEstandar: stdDev
    });

    // Umbral adaptativo más sensible
    this.adaptiveThreshold = avgValue + (stdDev * 1.0);

    const isValidShape = this.validatePeakShape(currentValue, signalBuffer);
    const hasSignificantAmplitude = currentValue > this.adaptiveThreshold;
    const isLocalMaximum = this.isLocalMax(currentValue, signalBuffer);

    console.log('🎯 Validaciones:', {
      formaValida: isValidShape,
      amplitudSignificativa: hasSignificantAmplitude,
      esMaximoLocal: isLocalMaximum,
      umbralAdaptativo: this.adaptiveThreshold
    });

    if (hasSignificantAmplitude && isLocalMaximum && isValidShape) {
      if (timeSinceLastPeak > maxTimeGap) {
        console.log('⚠️ Demasiado tiempo desde el último pico, reseteando');
        this.lastPeakTime = now;
        this.peakBuffer = [];
        this.timeBuffer = [];
        return false;
      }

      const currentInterval = timeSinceLastPeak;
      const isValidInterval = this.validatePeakInterval(currentInterval);
      
      console.log('⏱️ Validación de intervalo:', {
        intervalo: currentInterval,
        valido: isValidInterval
      });

      if (isValidInterval) {
        this.lastPeakTime = now;
        this.updatePeakHistory(currentValue, now);
        const estimatedBPM = 60000 / currentInterval;
        
        console.log('💓 PICO VÁLIDO DETECTADO:', {
          bpmEstimado: estimatedBPM,
          calidad: this.calculatePeakQuality(currentValue, avgValue, stdDev)
        });
        
        return true;
      }
    }

    return false;
  }

  private isLocalMax(currentValue: number, signalBuffer: number[]): boolean {
    const window = 5; // Ventana de análisis aumentada
    const recent = signalBuffer.slice(-window);
    return currentValue >= Math.max(...recent);
  }

  private validatePeakShape(currentValue: number, signalBuffer: number[]): boolean {
    if (signalBuffer.length < 6) return false;

    const last6Values = [...signalBuffer.slice(-5), currentValue];
    
    // Verificar forma de onda típica de PPG
    const isRising = last6Values[4] > last6Values[3] && 
                    last6Values[3] > last6Values[2] &&
                    last6Values[2] > last6Values[1];
    const isPeak = currentValue > last6Values[4];
    const hasDip = last6Values[1] < last6Values[0]; // Verifica el valle anterior
    
    return isRising && isPeak && hasDip;
  }

  private validatePeakInterval(currentInterval: number): boolean {
    if (this.timeBuffer.length < 2) {
      return currentInterval >= this.minPeakDistance;
    }

    const recentIntervals = this.timeBuffer.slice(-3);
    const avgInterval = recentIntervals.reduce((a, b) => a + b, 0) / recentIntervals.length;
    
    // Tolerancia más estricta para latidos reales
    const maxVariation = 0.25; // 25% de variación máxima
    const isWithinRange = Math.abs(currentInterval - avgInterval) <= avgInterval * maxVariation;
    const isPhysiologicallyValid = currentInterval >= this.minPeakDistance && 
                                  currentInterval <= (60 / this.MIN_BPM) * 1000;

    return isWithinRange && isPhysiologicallyValid;
  }

  private calculatePeakQuality(peakValue: number, mean: number, stdDev: number): number {
    const snr = (peakValue - mean) / stdDev; // Signal-to-noise ratio
    const normalizedQuality = Math.min(Math.max(snr / 4, 0), 1); // Normalizar entre 0 y 1
    return normalizedQuality;
  }

  private updatePeakHistory(peakValue: number, timestamp: number) {
    if (this.peakBuffer.length >= this.bufferSize) {
      this.peakBuffer.shift();
      this.timeBuffer.shift();
    }
    
    this.peakBuffer.push(peakValue);
    this.timeBuffer.push(timestamp);

    // Log detallado de calidad de detección
    if (this.timeBuffer.length > 1) {
      const intervals = this.timeBuffer.slice(1).map((t, i) => t - this.timeBuffer[i]);
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const bpm = 60000 / avgInterval;
      
      console.log('Análisis de latido:', {
        intervalPromedio: avgInterval,
        bpmCalculado: bpm,
        cantidadPicos: this.peakBuffer.length,
        calidadSeñal: this.calculateSignalQuality(intervals)
      });
    }
  }

  private calculateSignalQuality(intervals: number[]): number {
    if (intervals.length < 2) return 0;
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    
    // Coeficiente de variación (menor es mejor)
    const cv = stdDev / avgInterval;
    return Math.max(0, 1 - cv);
  }

  getLastPeakTime(): number {
    return this.lastPeakTime;
  }
}
