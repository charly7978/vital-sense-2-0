import { 
  SignalQuality,
  SignalQualityLevel,
  PPGData,
  ProcessingConfig,
  ProcessingState,
  ProcessorMetrics 
} from '@/types';

export class PPGProcessor {
  private config: ProcessingConfig;
  private state: ProcessingState;
  private components: {
    filter: {
      coefficients: Float64Array;
      state: Float64Array;
    };
    detector: {
      threshold: number;
      minPeakDistance: number;
      peaks: number[];
      valleys: number[];
    };
    analyzer: {
      fftSize: number;
      spectrum: Float64Array;
      phase: Float64Array;
      magnitude: Float64Array;
    };
  };

  constructor() {
    // Configuración inicial
    this.config = {
      mode: 'normal',
      bufferSize: 512,
      sampleRate: 30,
      filterOrder: 32,
      lowCutoff: 0.5,
      highCutoff: 4.0,
      peakThreshold: 0.3,
      minPeakDistance: 0.3,
      calibrationDuration: 5000,
      adaptiveThreshold: true,
      sensitivity: {
        brightness: 1.0,
        redIntensity: 1.0,
        signalAmplification: 1.0,
        noiseReduction: 1.0,
        peakDetection: 1.0,
        heartbeatThreshold: 1.0,
        responseTime: 1.0,
        signalStability: 1.0
      },
      calibration: {
        isCalibrating: false,
        progress: 0,
        message: '',
        isCalibrated: false,
        calibrationTime: 0,
        referenceValues: new Float64Array(),
        calibrationQuality: 0
      }
    };

    // Estado inicial
    this.state = {
      isProcessing: false,
      frameCount: 0,
      buffer: new Float64Array(this.config.bufferSize),
      timeBuffer: new Float64Array(this.config.bufferSize),
      lastTimestamp: 0,
      sampleRate: this.config.sampleRate,
      calibration: {
        isCalibrating: false,
        progress: 0,
        message: '',
        isCalibrated: false,
        calibrationTime: 0,
        referenceValues: new Float64Array(),
        calibrationQuality: 0
      },
      quality: {
        level: SignalQualityLevel.Invalid,
        score: 0,
        confidence: 0,
        overall: 0,
        history: [],
        signal: 0,
        noise: 0,
        movement: 0
      },
      optimization: {
        cache: new Map(),
        performance: new Map(),
        resources: new Map()
      }
    };

    // Componentes de procesamiento
    this.components = {
      filter: {
        coefficients: this.designFilter(),
        state: new Float64Array(this.config.filterOrder)
      },
      detector: {
        threshold: this.config.peakThreshold,
        minPeakDistance: this.config.minPeakDistance,
        peaks: [],
        valleys: []
      },
      analyzer: {
        fftSize: 512,
        spectrum: new Float64Array(256),
        phase: new Float64Array(256),
        magnitude: new Float64Array(256)
      }
    };

    this.initialize();
  }

  private initialize(): void {
    this.state.isProcessing = true;
    this.updateFilterCoefficients();
    this.resetBuffers();
  }

  private resetBuffers(): void {
    this.state.buffer.fill(0);
    this.state.timeBuffer.fill(0);
    this.components.detector.peaks = [];
    this.components.detector.valleys = [];
    this.state.frameCount = 0;
  }

  private designFilter(): Float64Array {
    // Diseño de filtro FIR paso banda
    const coefficients = new Float64Array(this.config.filterOrder);
    const omega1 = 2 * Math.PI * this.config.lowCutoff / this.state.sampleRate;
    const omega2 = 2 * Math.PI * this.config.highCutoff / this.state.sampleRate;
    
    for (let n = 0; n < this.config.filterOrder; n++) {
      if (n === this.config.filterOrder / 2) {
        coefficients[n] = (omega2 - omega1) / Math.PI;
      } else {
        const k = n - this.config.filterOrder / 2;
        coefficients[n] = (Math.sin(omega2 * k) - Math.sin(omega1 * k)) / (Math.PI * k);
      }
      // Aplicar ventana Hamming
      coefficients[n] *= 0.54 - 0.46 * Math.cos(2 * Math.PI * n / this.config.filterOrder);
    }
    
    return coefficients;
  }

  private updateFilterCoefficients(): void {
    this.components.filter.coefficients = this.designFilter();
    this.components.filter.state.fill(0);
  }

  public processFrame(imageData: ImageData): PPGData {
    try {
      if (!this.state.isProcessing) {
        throw new Error('Processor not initialized');
      }

      const signal = this.extractPPGSignal(imageData);
      this.updateBuffers(signal);
      const filteredSignal = this.filterSignal(this.state.buffer);
      this.detectPeaks(filteredSignal);
      const bpm = this.calculateBPM();
      const quality = this.assessQuality(filteredSignal);

      if (this.state.calibration.isCalibrating) {
        this.updateCalibration(signal);
      }

      this.performSpectralAnalysis(filteredSignal);

      return {
        bpm: Math.round(bpm),
        confidence: quality.overall,
        timestamp: Date.now(),
        values: Array.from(filteredSignal)
      };

    } catch (error) {
      console.error('Error processing frame:', error);
      return {
        bpm: 0,
        confidence: 0,
        timestamp: Date.now(),
        values: []
      };
    }
  }

  private extractPPGSignal(imageData: ImageData): number {
    let redSum = 0;
    let greenSum = 0;
    let pixelCount = 0;

    for (let i = 0; i < imageData.data.length; i += 4) {
      redSum += imageData.data[i];
      greenSum += imageData.data[i + 1];
      pixelCount++;
    }

    // Usar principalmente el canal verde con algo de información del rojo
    return (greenSum * 0.7 + redSum * 0.3) / pixelCount;
  }

  private updateBuffers(signal: number): void {
    // Desplazar buffer
    this.state.buffer.copyWithin(0, 1);
    this.state.timeBuffer.copyWithin(0, 1);

    // Añadir nueva muestra
    const timestamp = Date.now();
    this.state.buffer[this.state.buffer.length - 1] = signal;
    this.state.timeBuffer[this.state.timeBuffer.length - 1] = timestamp;

    // Actualizar tasa de muestreo
    if (this.state.lastTimestamp) {
      const dt = timestamp - this.state.lastTimestamp;
      this.state.sampleRate = 1000 / dt;
    }
    this.state.lastTimestamp = timestamp;
    this.state.frameCount++;
  }

  private filterSignal(signal: Float64Array): Float64Array {
    const filtered = new Float64Array(signal.length);
    const { coefficients, state } = this.components.filter;

    // Filtrado FIR con estado
    for (let n = 0; n < signal.length; n++) {
      let y = 0;
      // Desplazar estado
      state.copyWithin(1, 0);
      state[0] = signal[n];

      // Aplicar coeficientes
      for (let k = 0; k < coefficients.length; k++) {
        y += coefficients[k] * state[k];
      }
      filtered[n] = y;
    }

    return filtered;
  }

  private detectPeaks(signal: Float64Array): void {
    const { threshold, minPeakDistance } = this.components.detector;
    const peaks: number[] = [];
    const valleys: number[] = [];

    // Detección de picos y valles
    for (let i = 1; i < signal.length - 1; i++) {
      if (signal[i] > signal[i-1] && signal[i] > signal[i+1] && 
          signal[i] > threshold * Math.max(...signal)) {
        peaks.push(i);
      }
      if (signal[i] < signal[i-1] && signal[i] < signal[i+1] && 
          signal[i] < -threshold * Math.max(...signal)) {
        valleys.push(i);
      }
    }

    // Filtrar picos muy cercanos
    this.components.detector.peaks = this.filterClosePeaks(peaks, minPeakDistance);
    this.components.detector.valleys = this.filterClosePeaks(valleys, minPeakDistance);
  }

  private filterClosePeaks(peaks: number[], minDistance: number): number[] {
    const filtered: number[] = [];
    let lastPeak = -minDistance * this.state.sampleRate;

    for (const peak of peaks) {
      if (peak - lastPeak >= minDistance * this.state.sampleRate) {
        filtered.push(peak);
        lastPeak = peak;
      }
    }

    return filtered;
  }

  private calculateBPM(): number {
    const { peaks } = this.components.detector;
    if (peaks.length < 2) return 0;

    // Calcular intervalos entre picos
    const intervals: number[] = [];
    for (let i = 1; i < peaks.length; i++) {
      const interval = (this.state.timeBuffer[peaks[i]] - 
                       this.state.timeBuffer[peaks[i-1]]) / 1000;
      intervals.push(interval);
    }

    // Calcular BPM promedio
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;
    const bpm = 60 / avgInterval;

    // Limitar rango válido de BPM
    return Math.min(Math.max(bpm, 40), 200);
  }

  private performSpectralAnalysis(signal: Float64Array): void {
    const { fftSize } = this.components.analyzer;
    
    // Aplicar ventana Hanning
    const windowed = new Float64Array(fftSize);
    for (let i = 0; i < signal.length; i++) {
      windowed[i] = signal[i] * (0.5 - 0.5 * Math.cos(2 * Math.PI * i / (signal.length - 1)));
    }

    // Calcular FFT (implementación simplificada)
    const { magnitude, phase } = this.computeFFT(windowed);
    
    this.components.analyzer.magnitude = magnitude;
    this.components.analyzer.phase = phase;
  }

  private computeFFT(signal: Float64Array): { magnitude: Float64Array; phase: Float64Array } {
    const n = signal.length;
    const magnitude = new Float64Array(n/2);
    const phase = new Float64Array(n/2);

    // FFT simplificada (en producción usar una biblioteca FFT optimizada)
    for (let k = 0; k < n/2; k++) {
      let re = 0, im = 0;
      for (let t = 0; t < n; t++) {
        const angle = 2 * Math.PI * t * k / n;
        re += signal[t] * Math.cos(angle);
        im -= signal[t] * Math.sin(angle);
      }
      magnitude[k] = Math.sqrt(re*re + im*im);
      phase[k] = Math.atan2(im, re);
    }

    return { magnitude, phase };
  }

  private assessQuality(signal: Float64Array): SignalQuality {
    // Calcular SNR
    const signalPower = this.calculateSignalPower(signal);
    const noisePower = this.calculateNoisePower(signal);
    const snr = signalPower / (noisePower + 1e-10);

    // Detectar movimiento
    const movement = this.detectMovement(signal);

    // Calcular calidad general
    const quality: SignalQuality = {
      level: SignalQualityLevel.Invalid,
      score: 0,
      confidence: 0,
      overall: 0,
      signal: Math.min(Math.max(snr / 10, 0), 1),
      noise: Math.min(Math.max(1 - noisePower / signalPower, 0), 1),
      movement: Math.min(Math.max(1 - movement, 0), 1),
      history: []
    };

    // Calidad general ponderada
    quality.overall = (quality.signal * 0.4 + 
                      quality.noise * 0.3 + 
                      quality.movement * 0.3);

    this.state.quality = quality;
    return quality;
  }

  private calculateSignalPower(signal: Float64Array): number {
    return signal.reduce((sum, x) => sum + x * x, 0) / signal.length;
  }

  private calculateNoisePower(signal: Float64Array): number {
    const trend = this.estimateTrend(signal);
    return signal.reduce((sum, x, i) => sum + Math.pow(x - trend[i], 2), 0) / signal.length;
  }

  private estimateTrend(signal: Float64Array): Float64Array {
    const trend = new Float64Array(signal.length);
    const windowSize = Math.floor(signal.length / 4);

    for (let i = 0; i < signal.length; i++) {
      let sum = 0;
      let count = 0;
      for (let j = Math.max(0, i - windowSize); j < Math.min(signal.length, i + windowSize); j++) {
        sum += signal[j];
        count++;
      }
      trend[i] = sum / count;
    }

    return trend;
  }

  private detectMovement(signal: Float64Array): number {
    const diff = new Float64Array(signal.length - 1);
    for (let i = 0; i < diff.length; i++) {
      diff[i] = signal[i + 1] - signal[i];
    }
    return Math.sqrt(diff.reduce((sum, x) => sum + x * x, 0) / diff.length);
  }

  public startCalibration(): void {
    this.state.calibration = {
      isCalibrated: false,
      isCalibrating: true,
      progress: 0,
      message: '',
      referenceValues: new Float64Array(this.config.bufferSize),
      calibrationQuality: 0,
      calibrationTime: 0
    };

    // Detener calibración después del tiempo configurado
    setTimeout(() => {
      this.finalizeCalibration();
    }, this.config.calibrationDuration);
  }

  private updateCalibration(signal: number): void {
    if (!this.state.calibration.isCalibrating) return;

    const { referenceValues } = this.state.calibration;
    const progress = this.state.frameCount / (this.config.calibrationDuration / 1000 * this.state.sampleRate);

    referenceValues[this.state.frameCount % referenceValues.length] = signal;
    this.state.calibration.progress = Math.min(progress, 1);
  }

  private finalizeCalibration(): void {
    if (!this.state.calibration.isCalibrating) return;

    const { referenceValues } = this.state.calibration;
    
    // Calcular estadísticas de calibración
    const mean = referenceValues.reduce((a, b) => a + b) / referenceValues.length;
    const std = Math.sqrt(
      referenceValues.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / referenceValues.length
    );

    // Actualizar umbrales basados en la calibración
    this.components.detector.threshold = std * 2;
    
    // Finalizar calibración
    this.state.calibration.isCalibrating = false;
    this.state.calibration.isCalibrated = true;
    this.state.calibration.calibrationQuality = this.calculateCalibrationQuality();
  }

  private calculateCalibrationQuality(): number {
    const { referenceValues } = this.state.calibration;
    const filtered = this.filterSignal(referenceValues);
    const quality = this.assessQuality(filtered);
    return quality.overall;
  }

  public stop(): void {
    this.state.isProcessing = false;
    this.cleanupResources();
    this.resetBuffers();
    this.state.calibration.isCalibrating = false;
  }

  private cleanupResources(): void {
    try {
      // Limpiar buffers
      this.state.buffer = new Float64Array(this.config.bufferSize);
      this.state.timeBuffer = new Float64Array(this.config.bufferSize);
      
      // Limpiar componentes
      this.components.filter.state.fill(0);
      this.components.detector.peaks = [];
      this.components.detector.valleys = [];
      this.components.analyzer.spectrum.fill(0);
      this.components.analyzer.phase.fill(0);
      this.components.analyzer.magnitude.fill(0);
      
      // Resetear métricas y estados
      this.state.frameCount = 0;
      this.state.lastTimestamp = 0;
      
      // Limpiar calibración
      this.state.calibration = {
        isCalibrated: false,
        isCalibrating: false,
        progress: 0,
        message: '',
        referenceValues: new Float64Array(),
        calibrationQuality: 0,
        calibrationTime: 0
      };
      
      // Limpiar calidad
      this.state.quality = {
        overall: 0,
        signal: 0,
        noise: 0,
        movement: 0,
        confidence: 0,
        score: 0,
        history: [],
        level: SignalQualityLevel.Invalid
      };
    } catch (error) {
      console.error('Error cleaning up resources:', error);
    }
  }
}
