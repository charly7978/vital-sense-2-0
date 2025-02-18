
import { SignalFilterConfig, SensitivitySettings } from '@/types';

export class SignalFilter {
  private config: SignalFilterConfig;
  private sensitivity: SensitivitySettings;
  private buffer: Float32Array;
  private coefficients: {
    a: Float32Array;
    b: Float32Array;
  };

  constructor() {
    this.config = {
      samplingRate: 30,
      cutoffLow: 0.5,
      cutoffHigh: 4.0,
      order: 4
    };

    this.sensitivity = {
      brightness: 1.0,
      redIntensity: 1.0,
      signalAmplification: 1.0,
      noiseReduction: 1.0,
      peakDetection: 1.0,
      heartbeatThreshold: 0.5,
      responseTime: 1.0,
      signalStability: 0.5
    };

    this.buffer = new Float32Array(128);
    this.coefficients = this.calculateCoefficients();
  }

  public initialize(config: Partial<SignalFilterConfig>): void {
    this.config = { ...this.config, ...config };
    this.coefficients = this.calculateCoefficients();
    this.reset();
  }

  public updateSensitivity(settings: Partial<SensitivitySettings>): void {
    this.sensitivity = { ...this.sensitivity, ...settings };
    this.coefficients = this.calculateCoefficients();
  }

  public filter(signal: number): number {
    // Desplazar el buffer
    this.buffer.copyWithin(0, 1);
    this.buffer[this.buffer.length - 1] = signal;

    // Aplicar filtro
    let output = 0;
    for (let i = 0; i < this.coefficients.b.length; i++) {
      output += this.coefficients.b[i] * this.buffer[this.buffer.length - 1 - i];
    }
    for (let i = 1; i < this.coefficients.a.length; i++) {
      output -= this.coefficients.a[i] * this.buffer[this.buffer.length - 1 - i];
    }

    // Aplicar sensibilidad
    output *= this.sensitivity.signalAmplification;
    output *= this.sensitivity.noiseReduction;

    return output;
  }

  public reset(): void {
    this.buffer.fill(0);
  }

  private calculateCoefficients(): { a: Float32Array; b: Float32Array } {
    // Implementación del filtro Butterworth
    const w1 = 2 * Math.PI * this.config.cutoffLow / this.config.samplingRate;
    const w2 = 2 * Math.PI * this.config.cutoffHigh / this.config.samplingRate;
    
    // Coeficientes del filtro paso banda
    const a = new Float32Array(this.config.order + 1);
    const b = new Float32Array(this.config.order + 1);

    // Cálculo de coeficientes usando el método bilineal
    const alpha = Math.sin((w2 - w1) / 2) / Math.cos((w2 + w1) / 2);
    const beta = Math.cos((w2 - w1) / 2) / Math.cos((w2 + w1) / 2);
    
    // Coeficientes normalizados
    a[0] = 1.0;
    a[1] = -2 * beta;
    a[2] = 1.0;
    
    b[0] = alpha;
    b[1] = 0.0;
    b[2] = -alpha;

    // Aplicar sensibilidad al filtro
    const stabilityFactor = this.sensitivity.signalStability;
    for (let i = 0; i < b.length; i++) {
      b[i] *= stabilityFactor;
    }

    return { a, b };
  }

  public getFrequencyResponse(frequency: number): number {
    const w = 2 * Math.PI * frequency / this.config.samplingRate;
    let response = { real: 0, imag: 0 };

    // Calcular respuesta en frecuencia
    for (let i = 0; i < this.coefficients.b.length; i++) {
      const phase = -i * w;
      response.real += this.coefficients.b[i] * Math.cos(phase);
      response.imag += this.coefficients.b[i] * Math.sin(phase);
    }

    for (let i = 1; i < this.coefficients.a.length; i++) {
      const phase = -i * w;
      response.real -= this.coefficients.a[i] * Math.cos(phase);
      response.imag -= this.coefficients.a[i] * Math.sin(phase);
    }

    return Math.sqrt(response.real * response.real + response.imag * response.imag);
  }

  public getConfig(): SignalFilterConfig {
    return { ...this.config };
  }

  public getSensitivity(): SensitivitySettings {
    return { ...this.sensitivity };
  }
}
