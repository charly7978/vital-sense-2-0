
export class SpectralAnalyzer {
  private config: any;

  constructor(config: any) {
    this.config = config;
  }

  async analyze(signal: any, options: any) {
    try {
      // Extraer el canal rojo de la imagen para análisis PPG
      const redChannel = this.extractRedChannel(signal);
      
      // Calcular la media móvil para suavizar la señal
      const smoothedSignal = this.movingAverage(redChannel, 5);
      
      // Detectar picos para frecuencia cardíaca
      const peaks = this.findPeaks(smoothedSignal);
      
      // Calcular la frecuencia cardíaca
      const frequency = this.calculateFrequency(peaks);
      
      // Calcular la calidad de la señal
      const quality = this.calculateSignalQuality(smoothedSignal);

      return {
        frequencies: [frequency],
        amplitudes: this.calculateAmplitudes(smoothedSignal),
        phase: this.calculatePhase(smoothedSignal),
        signal: smoothedSignal,
        features: {
          peaks,
          frequency,
          amplitude: Math.max(...smoothedSignal) - Math.min(...smoothedSignal)
        },
        quality
      };
    } catch (error) {
      console.error('Error en análisis espectral:', error);
      return {
        frequencies: [],
        amplitudes: [],
        phase: [],
        signal: [],
        features: {},
        quality: 0
      };
    }
  }

  private extractRedChannel(signal: any): number[] {
    if (signal && signal.data && signal.data.length > 0) {
      // Extraer solo el canal rojo (cada 4 bytes, RGBA)
      const redValues = [];
      for (let i = 0; i < signal.data.length; i += 4) {
        redValues.push(signal.data[i]);
      }
      return redValues;
    }
    return [];
  }

  private movingAverage(data: number[], windowSize: number): number[] {
    const result = [];
    for (let i = 0; i < data.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize); j < Math.min(data.length, i + windowSize + 1); j++) {
        sum += data[j];
        count++;
      }
      result.push(sum / count);
    }
    return result;
  }

  private findPeaks(data: number[]): number[] {
    const peaks = [];
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  private calculateFrequency(peaks: number[]): number {
    if (peaks.length < 2) return 0;
    
    // Calcular la distancia media entre picos
    let totalDistance = 0;
    for (let i = 1; i < peaks.length; i++) {
      totalDistance += peaks[i] - peaks[i - 1];
    }
    
    const averageDistance = totalDistance / (peaks.length - 1);
    // Convertir a frecuencia (asumiendo 30 fps)
    return 30 / averageDistance;
  }

  private calculateAmplitudes(signal: number[]): number[] {
    return signal.map(value => Math.abs(value - Math.mean(signal)));
  }

  private calculatePhase(signal: number[]): number[] {
    // Implementación básica de fase
    return signal.map((_, i) => (i / signal.length) * 2 * Math.PI);
  }

  private calculateSignalQuality(signal: number[]): number {
    if (signal.length === 0) return 0;

    // Calcular la varianza de la señal
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    
    // Calcular SNR aproximado
    const snr = Math.abs(mean) / Math.sqrt(variance);
    
    // Normalizar a un valor entre 0 y 1
    return Math.min(Math.max(snr / 10, 0), 1);
  }
}

// Extender Math con el método mean
declare global {
  interface Math {
    mean(numbers: number[]): number;
  }
}

Math.mean = function(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0) / numbers.length;
};
