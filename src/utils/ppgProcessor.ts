// ==================== PPGProcessor.ts ====================

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private peakTimes: number[] = [];
  private readonly samplingRate = 30;
  private readonly windowSize = 360; // 12 segundos exactos a 30fps
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private beepPlayer: BeepPlayer;
  private readonly signalBuffer: number[] = [];
  private readonly bufferSize = 60; // Aumentado para mejor estabilidad
  private readonly qualityThreshold = 0.4; // Aumentado para mejor precisión
  private lastValidBpm: number = 0;
  private lastValidTime: number = 0;
  private frameCount: number = 0;
  
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1.2,    // Reducido para mejor estabilidad
    noiseReduction: 1.5,         // Aumentado para mejor filtrado
    peakDetection: 1.1,          // Ajustado para menos falsos positivos
    heartbeatThreshold: 0.7,     // Aumentado para mejor detección
    responseTime: 1.2,           // Ajustado para mejor estabilidad
    signalStability: 0.7,        // Aumentado para mejor calidad
    brightness: 0.8,             // Optimizado para luz tenue
    redIntensity: 1.2            // Ajustado para mejor señal
  };

  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    this.frameCount++;
    const now = Date.now();
    
    // Extracción optimizada para luz tenue
    const { red, ir, quality } = this.signalExtractor.extractChannels(imageData);
    
    // Logging para debug
    if (this.frameCount % 30 === 0) {
      console.log('Estado del sensor:', {
        detectandoDedo: red > this.processingSettings.MIN_RED_VALUE,
        valorRojo: red.toFixed(2),
        umbralMinimo: this.processingSettings.MIN_RED_VALUE,
        calidadSenal: (quality * 100).toFixed(1) + '%'
      });
    }
    
    // Validación mejorada de señal
    if (
      quality < this.qualityThreshold || 
      red < this.processingSettings.MIN_RED_VALUE ||
      red > 180 // Límite superior para evitar saturación
    ) {
      console.log('❌ Señal no válida:', { 
        red: red.toFixed(2), 
        calidad: (quality * 100).toFixed(1) + '%',
        umbralCalidad: (this.qualityThreshold * 100).toFixed(1) + '%',
        umbralRojo: this.processingSettings.MIN_RED_VALUE
      });
      
      // Limpieza de buffers
      this.clearBuffers();
      return this.getEmptyReading();
    }

    // Actualización de buffers
    this.updateBuffers(red, ir, now);

    // Procesamiento de señal mejorado
    const filteredRed = this.signalFilter.bandPassFilter(this.redBuffer, 0.5, 4.0);
    const normalizedSignal = this.signalNormalizer.normalize(filteredRed);
    
    // Detección de picos mejorada
    const isPeak = this.peakDetector.isRealPeak(
      normalizedSignal[normalizedSignal.length - 1],
      now,
      normalizedSignal
    );

    // Manejo de beep más preciso
    if (isPeak && quality > 0.6) {
      this.beepPlayer.play();
    }

    // Cálculo de BPM más estable
    let currentBpm = 0;
    if (this.peakTimes.length >= 2) {
      currentBpm = this.calculateBPM(this.peakTimes);
      if (this.isValidBPM(currentBpm)) {
        this.lastValidBpm = currentBpm;
        this.lastValidTime = now;
      }
    }

    // Cálculo de SpO2 mejorado
    const { spo2, confidence } = this.signalProcessor.calculateSpO2(
      this.redBuffer,
      this.irBuffer
    );

    // Análisis de HRV mejorado
    const hrvMetrics = this.signalProcessor.analyzeHRV(this.peakTimes);

    // Estimación de presión arterial mejorada
    const { systolic, diastolic } = this.signalProcessor.estimateBloodPressure(
      normalizedSignal,
      this.peakTimes
    );

    // Actualización de lecturas para el gráfico
    this.updateReadings(red, now);

    return {
      bpm: this.lastValidBpm,
      spo2,
      systolic,
      diastolic,
      hasArrhythmia: hrvMetrics.hasArrhythmia,
      arrhythmiaType: hrvMetrics.type,
      signalQuality: quality,
      confidence,
      readings: this.readings,
      isPeak,
      hrvMetrics
    };
  }

  private clearBuffers(): void {
    this.redBuffer = [];
    this.irBuffer = [];
    this.readings = [];
    this.peakTimes = [];
  }

  private updateBuffers(red: number, ir: number, timestamp: number): void {
    if (this.redBuffer.length >= this.bufferSize) {
      this.redBuffer.shift();
      this.irBuffer.shift();
    }
    this.redBuffer.push(red);
    this.irBuffer.push(ir);
  }

  private calculateBPM(peakTimes: number[]): number {
    const intervals = [];
    for (let i = 1; i < peakTimes.length; i++) {
      intervals.push(peakTimes[i] - peakTimes[i-1]);
    }
    
    // Filtrar intervalos anómalos
    const validIntervals = this.filterOutliers(intervals);
    if (validIntervals.length < 2) return 0;

    const avgInterval = validIntervals.reduce((a, b) => a + b, 0) / validIntervals.length;
    return Math.round(60000 / avgInterval);
  }

  private isValidBPM(bpm: number): boolean {
    if (bpm < 40 || bpm > 200) return false;
    if (this.lastValidBpm === 0) return true;
    return Math.abs(bpm - this.lastValidBpm) <= 15;
  }

  private filterOutliers(intervals: number[]): number[] {
    if (intervals.length < 3) return intervals;
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const std = Math.sqrt(
      intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length
    );
    
    return intervals.filter(interval => 
      Math.abs(interval - mean) <= 2 * std
    );
  }

  private updateReadings(value: number, timestamp: number): void {
    if (this.readings.length >= this.windowSize) {
      this.readings.shift();
    }
    this.readings.push({ timestamp, value });
  }

  private getEmptyReading(): PPGData {
    return {
      bpm: 0,
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      hasArrhythmia: false,
      arrhythmiaType: 'Normal',
      signalQuality: 0,
      confidence: 0,
      readings: [],
      isPeak: false,
      hrvMetrics: {
        sdnn: 0,
        rmssd: 0,
        pnn50: 0,
        lfhf: 0
      }
    };
  }
}
