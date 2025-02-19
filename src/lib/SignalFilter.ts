import { SensitivitySettings, FilterConfig, FilterResponse } from '@/types';

/**
 * Filtro de señal avanzado con adaptación dinámica
 * Implementa múltiples etapas de filtrado y compensación
 */
export class SignalFilter {
  // Configuración y estado
  private readonly config: FilterConfig;
  private sensitivity: SensitivitySettings;
  
  // Buffers de filtrado
  private readonly bufferSize = 512;
  private inputBuffer: CircularBuffer<number>;
  private outputBuffer: CircularBuffer<number>;
  
  // Coeficientes de filtro
  private readonly ORDER = 4;
  private aCoeffs: Float32Array;
  private bCoeffs: Float32Array;
  
  // Estado adaptativo
  private noiseLevel = 0;
  private signalPower = 0;
  private adaptiveThreshold = 0;
  
  // Análisis de tendencia
  private trendBuffer: CircularBuffer<number>;
  private readonly TREND_SIZE = 90; // 3 segundos @ 30fps

  constructor(config: FilterConfig) {
    this.config = this.validateConfig(config);
    this.initializeBuffers();
    this.initializeCoefficients();
    this.setupAdaptiveSystem();
  }

  /**
   * Filtra una nueva muestra de señal
   * @param sample Nueva muestra
   * @returns Muestra filtrada
   */
  public filter(sample: number): number {
    try {
      // Preprocesamiento
      const normalizedSample = this.normalize(sample);
      this.inputBuffer.push(normalizedSample);

      // Detección y compensación de artefactos
      if (this.detectArtifact(normalizedSample)) {
        return this.compensateArtifact();
      }

      // Filtrado multi-etapa
      const filtered = this.multiStageFilter(normalizedSample);
      
      // Adaptación dinámica
      this.adaptFilter(filtered);
      
      // Post-procesamiento
      const processed = this.postProcess(filtered);
      
      // Actualizar buffers y estado
      this.updateState(processed);
      
      return processed;

    } catch (error) {
      console.error('Error en filtrado:', error);
      return this.getLastValidOutput();
    }
  }

  /**
   * Filtrado multi-etapa optimizado
   */
  private multiStageFilter(sample: number): number {
    // Etapa 1: Filtro paso banda
    const bandpassed = this.bandpassFilter(sample);
    
    // Etapa 2: Eliminación de tendencia
    const detrended = this.detrendSignal(bandpassed);
    
    // Etapa 3: Filtro adaptativo
    const adaptive = this.adaptiveFilter(detrended);
    
    // Etapa 4: Suavizado
    return this.smoothSignal(adaptive);
  }

  /**
   * Filtro paso banda IIR
   */
  private bandpassFilter(sample: number): number {
    let output = 0;
    
    // Aplicar coeficientes FIR
    for (let i = 0; i < this.ORDER; i++) {
      output += this.bCoeffs[i] * this.inputBuffer.get(i);
    }
    
    // Aplicar coeficientes IIR
    for (let i = 1; i < this.ORDER; i++) {
      output -= this.aCoeffs[i] * this.outputBuffer.get(i - 1);
    }
    
    return output;
  }

  /**
   * Filtro adaptativo basado en LMS
   */
  private adaptiveFilter(sample: number): number {
    const mu = 0.01; // Tasa de adaptación
    let output = sample;
    
    // Calcular error
    const error = this.calculateError(sample);
    
    // Actualizar coeficientes
    for (let i = 0; i < this.ORDER; i++) {
      this.bCoeffs[i] += mu * error * this.inputBuffer.get(i);
    }
    
    // Aplicar filtro actualizado
    output = this.applyAdaptiveCoefficients(sample);
    
    return output;
  }

  /**
   * Detección y compensación de artefactos
   */
  private detectArtifact(sample: number): boolean {
    // Calcular estadísticas de la señal
    const stats = this.calculateSignalStats();
    
    // Detección basada en múltiples criterios
    const isArtifact = 
      this.isAmplitudeArtifact(sample, stats) ||
      this.isGradientArtifact(sample, stats) ||
      this.isStatisticalArtifact(sample, stats);
      
    return isArtifact;
  }

  /**
   * Compensación de artefactos
   */
  private compensateArtifact(): number {
    // Interpolación de últimas muestras válidas
    const validSamples = this.getLastValidSamples(5);
    return this.interpolate(validSamples);
  }

  /**
   * Actualización de estado y adaptación
   */
  private updateState(sample: number): void {
    // Actualizar niveles de señal y ruido
    this.updateSignalLevels(sample);
    
    // Adaptar umbrales
    this.adaptThresholds();
    
    // Actualizar tendencia
    this.updateTrend(sample);
  }

  /**
   * Adaptación dinámica del filtro
   */
  private adaptFilter(sample: number): void {
    // Calcular SNR
    const snr = this.calculateSNR();
    
    // Adaptar coeficientes según SNR
    if (snr < this.config.minSNR) {
      this.increaseFiltering();
    } else if (snr > this.config.maxSNR) {
      this.decreaseFiltering();
    }
  }

  /**
   * Actualización de coeficientes del filtro
   */
  private updateCoefficients(): void {
    // Calcular nuevos coeficientes
    const {a, b} = this.designFilter({
      order: this.ORDER,
      cutoffLow: this.config.cutoffLow,
      cutoffHigh: this.config.cutoffHigh,
      samplingRate: this.config.samplingRate
    });
    
    // Aplicar ventana de transición
    this.smoothTransition(this.aCoeffs, a);
    this.smoothTransition(this.bCoeffs, b);
    
    // Actualizar coeficientes
    this.aCoeffs = a;
    this.bCoeffs = b;
  }

  /**
   * Obtener respuesta en frecuencia
   */
  public getFrequencyResponse(): FilterResponse {
    const frequencies = new Float32Array(this.bufferSize / 2);
    const magnitudes = new Float32Array(this.bufferSize / 2);
    const phases = new Float32Array(this.bufferSize / 2);
    
    // Calcular respuesta para cada frecuencia
    for (let i = 0; i < frequencies.length; i++) {
      frequencies[i] = i * this.config.samplingRate / this.bufferSize;
      const response = this.calculateResponse(frequencies[i]);
      magnitudes[i] = response.magnitude;
      phases[i] = response.phase;
    }
    
    return { frequencies, magnitudes, phases };
  }

  /**
   * Reset del filtro
   */
  public reset(): void {
    this.inputBuffer.clear();
    this.outputBuffer.clear();
    this.trendBuffer.clear();
    this.initializeCoefficients();
    this.noiseLevel = 0;
    this.signalPower = 0;
    this.adaptiveThreshold = 0;
  }
}
