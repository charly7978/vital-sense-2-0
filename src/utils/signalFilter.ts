
export class SignalFilter {
  private readonly sampleRate: number;
  private kalmanState = {
    x: 0,
    p: 1,
    q: 0.15, // Aumentado para mejor respuesta
    r: 0.8   // Reducido para menor suavizado
  };

  constructor(sampleRate: number = 30) {
    this.sampleRate = sampleRate;
  }

  lowPassFilter(signal: number[], cutoffFreq: number): number[] {
    // Aplicar Kalman filter primero
    const kalmanFiltered = signal.map(value => this.kalmanFilter(value));
    
    const filtered: number[] = [];
    const rc = 1.0 / (cutoffFreq * 2 * Math.PI);
    const dt = 1.0 / this.sampleRate;
    const alpha = dt / (rc + dt);
    const windowSize = Math.min(8, signal.length); // Reducido para mayor sensibilidad
    
    // Aplicar ventana Hamming mejorada
    for (let i = 0; i < kalmanFiltered.length; i++) {
      let sum = 0;
      let weightSum = 0;
      
      for (let j = Math.max(0, i - windowSize + 1); j <= i; j++) {
        // Ventana Hamming modificada para mejor respuesta a picos
        const weight = 0.54 - 0.46 * Math.cos((2 * Math.PI * (j - i + windowSize)) / windowSize);
        sum += kalmanFiltered[j] * weight * 1.5; // Amplificación de señal
        weightSum += weight;
      }
      
      filtered[i] = sum / weightSum;
    }
    
    // Aplicar filtro RC con alpha aumentado
    let lastFiltered = filtered[0];
    for (let i = 1; i < signal.length; i++) {
      lastFiltered = lastFiltered + alpha * 1.2 * (filtered[i] - lastFiltered);
      filtered[i] = lastFiltered;
    }
    
    return filtered;
  }

  private kalmanFilter(measurement: number): number {
    // Paso de predicción
    const predictedState = this.kalmanState.x;
    const predictedCovariance = this.kalmanState.p + this.kalmanState.q;
    
    // Paso de actualización con ganancia aumentada
    const kalmanGain = predictedCovariance / (predictedCovariance + this.kalmanState.r);
    this.kalmanState.x = predictedState + kalmanGain * 1.3 * (measurement - predictedState);
    this.kalmanState.p = (1 - kalmanGain) * predictedCovariance;
    
    return this.kalmanState.x;
  }

  updateKalmanParameters(q: number, r: number) {
    this.kalmanState.q = q;
    this.kalmanState.r = r;
  }
}
