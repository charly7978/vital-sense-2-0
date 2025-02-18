// ==================== PPGSynchronizer.ts ====================

export class PPGSynchronizer {
  // OPTIMIZACIÓN: Sistema PLL (Phase-Locked Loop) mejorado
  private readonly pll = {
    phase: 0,
    frequency: 1.0,        // Hz inicial
    bandwidth: 0.1,        // Factor de corrección
    damping: 0.707,        // Factor de amortiguación
    lockThreshold: 0.85    // Umbral de sincronización
  };

  // OPTIMIZACIÓN: Buffers mejorados
  private readonly bufferSize = 180;  // 6 segundos a 30fps
  private signalBuffer: number[] = [];
  private timeBuffer: number[] = [];
  private peakBuffer: boolean[] = [];
  private syncStatus: SyncStatus = {
    isLocked: false,
    quality: 0,
    phase: 0,
    frequency: 0
  };

  // OPTIMIZACIÓN: Constantes de sincronización
  private readonly SYNC_CONSTANTS = {
    minFrequency: 0.75,    // 45 BPM
    maxFrequency: 3.0,     // 180 BPM
    phaseThreshold: 0.1,   // Tolerancia de fase
    qualityThreshold: 0.6  // Calidad mínima
  };

  // OPTIMIZACIÓN: Sincronización mejorada
  synchronize(signal: number, timestamp: number): SyncResult {
    try {
      // OPTIMIZACIÓN: Actualización de buffers
      this.updateBuffers(signal, timestamp);

      // OPTIMIZACIÓN: Detección de fase actual
      const currentPhase = this.detectCurrentPhase();

      // OPTIMIZACIÓN: Predicción de fase
      const expectedPhase = this.predictNextPhase();

      // OPTIMIZACIÓN: Cálculo de error de fase
      const phaseError = this.calculatePhaseError(currentPhase, expectedPhase);

      // OPTIMIZACIÓN: Actualización de PLL
      this.updatePLL(phaseError);

      // OPTIMIZACIÓN: Detección de sincronización
      const isSynchronized = this.checkSynchronization();

      // OPTIMIZACIÓN: Corrección de señal
      const correctedSignal = this.applySynchronization(signal);

      // OPTIMIZACIÓN: Actualización de estado
      this.updateSyncStatus(isSynchronized, currentPhase);

      return {
        signal: correctedSignal,
        isPeak: this.detectPeak(correctedSignal),
        syncStatus: this.syncStatus,
        debug: {
          currentPhase,
          expectedPhase,
          phaseError,
          frequency: this.pll.frequency
        }
      };
    } catch (error) {
      console.error('Error en sincronización:', error);
      return this.getEmptyResult();
    }
  }

  // OPTIMIZACIÓN: Detección de fase mejorada
  private detectCurrentPhase(): number {
    if (this.signalBuffer.length < 3) return 0;

    // OPTIMIZACIÓN: Análisis de ventana deslizante
    const window = this.signalBuffer.slice(-3);
    const derivative = this.calculateDerivative(window);
    
    // OPTIMIZACIÓN: Detección de fase basada en derivada
    return this.phaseFromDerivative(derivative);
  }

  // OPTIMIZACIÓN: Predicción de fase mejorada
  private predictNextPhase(): number {
    const deltaTime = this.calculateDeltaTime();
    const predictedPhase = this.pll.phase + 
                          (this.pll.frequency * 2 * Math.PI * deltaTime);
    
    return this.normalizePhase(predictedPhase);
  }

  // OPTIMIZACIÓN: Actualización PLL mejorada
  private updatePLL(phaseError: number): void {
    // OPTIMIZACIÓN: Filtro de Kalman simplificado
    const kalmanGain = 0.7;
    
    // OPTIMIZACIÓN: Actualización de frecuencia
    this.pll.frequency += this.pll.bandwidth * phaseError * kalmanGain;
    this.pll.frequency = this.clampFrequency(this.pll.frequency);
    
    // OPTIMIZACIÓN: Actualización de fase
    this.pll.phase += phaseError * this.pll.damping;
    this.pll.phase = this.normalizePhase(this.pll.phase);
  }

  // OPTIMIZACIÓN: Sincronización de señal mejorada
  private applySynchronization(signal: number): number {
    // OPTIMIZACIÓN: Corrección de fase
    const phaseCorrection = Math.cos(this.pll.phase);
    
    // OPTIMIZACIÓN: Corrección de amplitud adaptativa
    const amplitudeCorrection = this.calculateAmplitudeCorrection();
    
    return signal * (1 + phaseCorrection * amplitudeCorrection);
  }

  // OPTIMIZACIÓN: Detección de picos mejorada
  private detectPeak(signal: number): boolean {
    if (this.signalBuffer.length < 3) return false;

    const window = this.signalBuffer.slice(-3);
    const isLocalMax = window[1] > window[0] && window[1] > window[2];
    const isInPhase = Math.abs(this.normalizePhase(this.pll.phase) - Math.PI) < 0.2;

    return isLocalMax && isInPhase && this.syncStatus.isLocked;
  }

  // OPTIMIZACIÓN: Métodos auxiliares mejorados
  private updateBuffers(signal: number, timestamp: number): void {
    this.signalBuffer.push(signal);
    this.timeBuffer.push(timestamp);

    if (this.signalBuffer.length > this.bufferSize) {
      this.signalBuffer.shift();
      this.timeBuffer.shift();
    }
  }

  private calculatePhaseError(current: number, expected: number): number {
    let error = current - expected;
    
    // OPTIMIZACIÓN: Normalización de error
    if (error > Math.PI) error -= 2 * Math.PI;
    if (error < -Math.PI) error += 2 * Math.PI;
    
    return error;
  }

  private normalizePhase(phase: number): number {
    return ((phase % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
  }

  private clampFrequency(frequency: number): number {
    return Math.min(Math.max(frequency, 
      this.SYNC_CONSTANTS.minFrequency), 
      this.SYNC_CONSTANTS.maxFrequency
    );
  }

  private calculateDeltaTime(): number {
    if (this.timeBuffer.length < 2) return 1/30; // 30fps por defecto
    return (this.timeBuffer[this.timeBuffer.length - 1] - 
            this.timeBuffer[this.timeBuffer.length - 2]) / 1000;
  }

  private calculateDerivative(window: number[]): number[] {
    const derivative = [];
    for (let i = 1; i < window.length; i++) {
      derivative.push(window[i] - window[i-1]);
    }
    return derivative;
  }

  private phaseFromDerivative(derivative: number[]): number {
    const angle = Math.atan2(derivative[1], derivative[0]);
    return this.normalizePhase(angle);
  }

  private calculateAmplitudeCorrection(): number {
    if (this.signalBuffer.length < 10) return 0.1;
    
    const recentSignals = this.signalBuffer.slice(-10);
    const variance = this.calculateVariance(recentSignals);
    
    return Math.min(0.2, variance * 0.1);
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
  }

  private checkSynchronization(): boolean {
    if (this.signalBuffer.length < 30) return false;

    const recentQuality = this.calculateSyncQuality();
    return recentQuality > this.pll.lockThreshold;
  }

  private calculateSyncQuality(): number {
    const phaseCoherence = this.calculatePhaseCoherence();
    const amplitudeStability = this.calculateAmplitudeStability();
    
    return phaseCoherence * 0.7 + amplitudeStability * 0.3;
  }

  private updateSyncStatus(isLocked: boolean, currentPhase: number): void {
    this.syncStatus = {
      isLocked,
      quality: this.calculateSyncQuality(),
      phase: currentPhase,
      frequency: this.pll.frequency
    };
  }

  private getEmptyResult(): SyncResult {
    return {
      signal: 0,
      isPeak: false,
      syncStatus: {
        isLocked: false,
        quality: 0,
        phase: 0,
        frequency: 0
      },
      debug: {
        currentPhase: 0,
        expectedPhase: 0,
        phaseError: 0,
        frequency: 0
      }
    };
  }
}

// OPTIMIZACIÓN: Interfaces mejoradas
interface SyncStatus {
  isLocked: boolean;
  quality: number;
  phase: number;
  frequency: number;
}

interface SyncResult {
  signal: number;
  isPeak: boolean;
  syncStatus: SyncStatus;
  debug: {
    currentPhase: number;
    expectedPhase: number;
    phaseError: number;
    frequency: number;
  };
}