
export class WaveletAnalyzer {
  private readonly waveletLevels = 4;
  private readonly motherWavelet = 'db4';
  private readonly minScale = 2;
  private readonly maxScale = 32;
  private readonly scaleStep = 1;
  private readonly qualityThreshold = 0.6;

  public detectPeaks(signal: number[]): number[] {
    if (!signal || signal.length < 4) {
      return [];
    }

    const { quality, peaks } = this.analyzeSignal(signal);
    return peaks;
  }

  public analyzeSignal(signal: number[]): { quality: number; peaks: number[] } {
    if (!signal || signal.length < 4) {
      return { quality: 0, peaks: [] };
    }

    try {
      const normalizedSignal = this.normalizeSignal(signal);
      const coefficients = this.waveletDecomposition(normalizedSignal);
      const peaks = this.findPeaks(coefficients);
      const quality = this.calculateSignalQuality(coefficients, normalizedSignal);

      return {
        quality: Math.min(quality, 1),
        peaks: peaks
      };

    } catch (error) {
      console.error('Error en análisis wavelet:', error);
      return { quality: 0, peaks: [] };
    }
  }

  private normalizeSignal(signal: number[]): number[] {
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const range = max - min;

    if (range === 0) return signal.map(() => 0);

    return signal.map(value => (value - min) / range);
  }

  private waveletDecomposition(signal: number[]): number[][] {
    const coefficients: number[][] = [];
    let currentSignal = [...signal];

    for (let level = 0; level < this.waveletLevels; level++) {
      const { approximation, detail } = this.singleLevelDWT(currentSignal);
      coefficients.push(detail);
      currentSignal = approximation;
    }

    return coefficients;
  }

  private singleLevelDWT(signal: number[]): { approximation: number[]; detail: number[] } {
    const N = signal.length;
    const approximation: number[] = [];
    const detail: number[] = [];

    for (let i = 0; i < N; i += 2) {
      if (i + 1 < N) {
        approximation.push((signal[i] + signal[i + 1]) / Math.sqrt(2));
        detail.push((signal[i] - signal[i + 1]) / Math.sqrt(2));
      } else {
        approximation.push(signal[i] / Math.sqrt(2));
        detail.push(signal[i] / Math.sqrt(2));
      }
    }

    return { approximation, detail };
  }

  private findPeaks(coefficients: number[][]): number[] {
    const peaks: number[] = [];
    const combinedCoefficients = this.combineCoefficients(coefficients);

    for (let i = 1; i < combinedCoefficients.length - 1; i++) {
      if (this.isPeak(combinedCoefficients, i)) {
        peaks.push(i);
      }
    }

    return this.filterPeaks(peaks, combinedCoefficients);
  }

  private combineCoefficients(coefficients: number[][]): number[] {
    const combined = new Array(coefficients[0].length).fill(0);

    for (let level = 0; level < coefficients.length; level++) {
      const weight = Math.pow(0.5, level);
      for (let i = 0; i < combined.length; i++) {
        if (i < coefficients[level].length) {
          combined[i] += coefficients[level][i] * weight;
        }
      }
    }

    return combined;
  }

  private calculateSignalQuality(coefficients: number[][], originalSignal: number[]): number {
    const energyRatio = this.calculateEnergyRatio(coefficients);
    const peakConsistency = this.calculatePeakConsistency(coefficients[0]);
    const signalToNoise = this.calculateSignalToNoise(originalSignal);

    return (energyRatio * 0.4 + peakConsistency * 0.3 + signalToNoise * 0.3);
  }

  private calculateEnergyRatio(coefficients: number[][]): number {
    const totalEnergy = coefficients.reduce((sum, level) =>
      sum + level.reduce((e, c) => e + c * c, 0), 0);

    if (totalEnergy === 0) return 0;

    const usefulEnergy = coefficients.slice(1, 3).reduce((sum, level) =>
      sum + level.reduce((e, c) => e + c * c, 0), 0);

    return usefulEnergy / totalEnergy;
  }

  private calculatePeakConsistency(detail: number[]): number {
    const peaks = this.detectPeaks([detail]);
    if (peaks.length < 2) return 0;

    const intervals = peaks.slice(1).map((peak, i) => peak - peaks[i]);
    const meanInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - meanInterval, 2), 0) / intervals.length;

    return Math.exp(-variance / (meanInterval * meanInterval));
  }

  private calculateSignalToNoise(signal: number[]): number {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;

    if (variance === 0) return 0;

    const smoothed = this.smoothSignal(signal);
    const noise = signal.map((v, i) => v - smoothed[i]);
    const noiseVariance = noise.reduce((a, b) => a + b * b, 0) / noise.length;

    return Math.min(1, variance / (noiseVariance + 1e-6));
  }

  private smoothSignal(signal: number[]): number[] {
    const windowSize = 5;
    const smoothed = [];
    
    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;
      
      for (let j = Math.max(0, i - windowSize); j < Math.min(signal.length, i + windowSize + 1); j++) {
        sum += signal[j];
        count++;
      }
      
      smoothed.push(sum / count);
    }
    
    return smoothed;
  }

  private isPeak(signal: number[], index: number): boolean {
    return signal[index] > signal[index - 1] &&
           signal[index] > signal[index + 1] &&
           signal[index] > this.calculateThreshold(signal);
  }

  private calculateThreshold(signal: number[]): number {
    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const stdDev = Math.sqrt(
      signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length
    );
    return mean + stdDev * 1.5;
  }

  private filterPeaks(peaks: number[], signal: number[]): number[] {
    if (peaks.length < 2) return peaks;

    const filteredPeaks: number[] = [peaks[0]];
    const minDistance = Math.floor(signal.length * 0.1);

    for (let i = 1; i < peaks.length; i++) {
      if (peaks[i] - filteredPeaks[filteredPeaks.length - 1] >= minDistance) {
        filteredPeaks.push(peaks[i]);
      }
    }

    return filteredPeaks;
  }
}
