export class SignalFilter {
    private readonly sampleRate: number;
    private readonly kalmanState = {
      x: 0,
      p: 1,
      q: 0.15,
      r: 0.8
    };
    
    private readonly movingAverageWindow = 5;
    private readonly butterworthCoefficients = {
      a: [1, -1.5164, 0.5321],
      b: [0.0079, 0.0158, 0.0079]
    };
    private readonly bufferSize = 3;
    private readonly xBuffer = new Array<number>(3).fill(0);
    private readonly yBuffer = new Array<number>(3).fill(0);
  
    constructor(sampleRate: number = 30) {
      this.sampleRate = sampleRate;
    }
  
    public filter(signal: number[]): number[] {
      if (signal.length < 2) return signal;
  
      const cleanSignal = this.removeOutliers(signal);
      const bandPassFiltered = this.bandPassFilter(cleanSignal, 0.5, 4.0);
      const kalmanFiltered = bandPassFiltered.map(v => this.kalmanFilter(v));
      
      return this.smoothSignal(kalmanFiltered);
    }
  
    private bandPassFilter(signal: number[], lowCutoff: number, highCutoff: number): number[] {
      const filtered: number[] = [];
      this.xBuffer.fill(0);
      this.yBuffer.fill(0);
  
      for (let i = 0; i < signal.length; i++) {
        for (let j = this.bufferSize - 1; j > 0; j--) {
          this.xBuffer[j] = this.xBuffer[j-1];
        }
        this.xBuffer[0] = signal[i];
  
        let y = 0;
        for (let j = 0; j < this.bufferSize; j++) {
          y += this.butterworthCoefficients.b[j] * this.xBuffer[j];
        }
        for (let j = 1; j < this.bufferSize; j++) {
          y -= this.butterworthCoefficients.a[j] * this.yBuffer[j-1];
        }
  
        for (let j = this.bufferSize - 1; j > 0; j--) {
          this.yBuffer[j] = this.yBuffer[j-1];
        }
        this.yBuffer[0] = y;
  
        filtered.push(y);
      }
  
      return filtered;
    }
  
    private kalmanFilter(measurement: number): number {
      const predictedState = this.kalmanState.x;
      const predictedCovariance = this.kalmanState.p + this.kalmanState.q;
      
      const kalmanGain = predictedCovariance / (predictedCovariance + this.kalmanState.r);
      this.kalmanState.x = predictedState + kalmanGain * (measurement - predictedState);
      this.kalmanState.p = (1 - kalmanGain) * predictedCovariance;
      
      return this.kalmanState.x;
    }
  
    private removeOutliers(signal: number[]): number[] {
      const stats = this.calculateStats(signal);
      const threshold = 2.5;
      
      return signal.map(value => {
        if (Math.abs(value - stats.mean) > threshold * stats.stdDev) {
          return stats.mean;
        }
        return value;
      });
    }
  
    private calculateStats(signal: number[]): { mean: number; stdDev: number } {
      const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
      const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
      const stdDev = Math.sqrt(variance);
      return { mean, stdDev };
    }
  
    private smoothSignal(signal: number[]): number[] {
      const smoothed: number[] = [];
      const halfWindow = Math.floor(this.movingAverageWindow / 2);
  
      for (let i = 0; i < signal.length; i++) {
        let sum = 0;
        let count = 0;
        
        for (let j = Math.max(0, i - halfWindow); j < Math.min(signal.length, i + halfWindow + 1); j++) {
          const weight = Math.exp(-Math.abs(i - j) / halfWindow);
          sum += signal[j] * weight;
          count += weight;
        }
        
        smoothed.push(sum / count);
      }
  
      return smoothed;
    }
  
    public processPPGSignal(signal: number[]): number[] {
      const detrended = this.removeTrend(signal);
      const filtered = this.bandPassFilter(detrended, 0.5, 4.0);
      return this.normalizeAmplitude(filtered);
    }
  
    private removeTrend(signal: number[]): number[] {
      const windowSize = Math.min(30, Math.floor(signal.length / 3));
      const detrended: number[] = [];
      
      for (let i = 0; i < signal.length; i++) {
        const start = Math.max(0, i - windowSize);
        const end = Math.min(signal.length, i + windowSize + 1);
        const trend = signal
          .slice(start, end)
          .reduce((a, b) => a + b, 0) / (end - start);
        
        detrended.push(signal[i] - trend);
      }
      
      return detrended;
    }
  
    private normalizeAmplitude(signal: number[]): number[] {
      const maxAbs = Math.max(...signal.map(Math.abs));
      if (maxAbs === 0) return signal;
      return signal.map(v => v / maxAbs);
    }
  
    public processRealTimeSignal(value: number): number {
      const kalmanFiltered = this.kalmanFilter(value);
      this.updateBuffers(kalmanFiltered);
      return this.realTimeBandPass(kalmanFiltered);
    }
  
    private updateBuffers(value: number): void {
      for (let i = this.bufferSize - 1; i > 0; i--) {
        this.xBuffer[i] = this.xBuffer[i-1];
        this.yBuffer[i] = this.yBuffer[i-1];
      }
      this.xBuffer[0] = value;
    }
  
    private realTimeBandPass(value: number): number {
      let y = 0;
      for (let j = 0; j < this.bufferSize; j++) {
        y += this.butterworthCoefficients.b[j] * this.xBuffer[j];
      }
      for (let j = 1; j < this.bufferSize; j++) {
        y -= this.butterworthCoefficients.a[j] * this.yBuffer[j-1];
      }
      
      this.yBuffer[0] = y;
      return y;
    }
  }
