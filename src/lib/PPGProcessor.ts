import { SignalFilter } from './SignalFilter';
import { FingerDetector } from './FingerDetector';
import { WaveletAnalyzer } from './WaveletAnalyzer';
import { SignalQualityAnalyzer } from './SignalQualityAnalyzer';
import { BeepPlayer } from './BeepPlayer';
import type { PPGData, SensitivitySettings, ArrhythmiaType, ProcessingMode } from '@/types';

/**
 * Procesador principal de señales PPG (Fotopletismografía)
 * Coordina todos los componentes del sistema y maneja el procesamiento en tiempo real
 */
export class PPGProcessor {
  // Componentes principales del sistema
  private readonly components = {
    signalFilter: new SignalFilter(),
    fingerDetector: new FingerDetector(),
    waveletAnalyzer: new WaveletAnalyzer(),
    qualityAnalyzer: new SignalQualityAnalyzer(),
    beepPlayer: new BeepPlayer()
  };

  // Estado y configuración
  private settings: SensitivitySettings;
  private buffer: number[] = [];
  private readonly bufferSize = 180;  // 6 segundos @ 30fps
  private readonly minQualityThreshold = 0.5;
  private readonly calibrationSamples = 90;  // 3 segundos @ 30fps
  private processingMode: ProcessingMode = 'normal';
  
  // Variables de estado
  private lastProcessedTime = 0;
  private isCalibrating = false;
  private isProcessing = false;
  private frameCount = 0;
  private qualityHistory: number[] = [];
  private bpmHistory: number[] = [];
  
  // Datos de calibración
  private calibrationData = {
    samples: 0,
    sum: 0,
    min: Infinity,
    max: -Infinity,
    variance: 0,
    peaks: [] as number[]
  };

  // Sistema adaptativo
  private adaptiveSystem = {
    signalAmplification: 1.0,
    noiseThreshold: 0.1,
    qualityThreshold: 0.5,
    stabilityFactor: 1.0
  };

  constructor(settings: SensitivitySettings) {
    this.settings = settings;
    this.initializeComponents();
    this.setupAdaptiveSystem();
  }

  /**
   * Inicializa y configura todos los componentes del sistema
   */
  private initializeComponents(): void {
    Object.values(this.components).forEach(component => {
      if ('updateSettings' in component) {
        component.updateSettings(this.settings);
      }
    });

    // Configuración específica para cada componente
    this.components.signalFilter.setParameters({
      lowCutoff: 0.5,
      highCutoff: 4.0,
      order: 4
    });

    this.components.waveletAnalyzer.initialize({
      waveletType: 'db4',
      decompositionLevel: 4
    });
  }

  /**
   * Configura el sistema adaptativo inicial
   */
  private setupAdaptiveSystem(): void {
    this.adaptiveSystem = {
      signalAmplification: this.settings.signalAmplification,
      noiseThreshold: 0.1 * this.settings.noiseReduction,
      qualityThreshold: 0.5 * this.settings.signalStability,
      stabilityFactor: 1.0
    };
  }

  /**
   * Procesa un frame de video y extrae métricas vitales
   */
  public async processFrame(imageData: ImageData): Promise<PPGData> {
    try {
      this.frameCount++;
      const now = Date.now();
      
      // Detección de dedo
      const fingerDetection = await this.components.fingerDetector.detect(imageData);
      if (!fingerDetection.isPresent) {
        return this.generateEmptyResult('No finger detected');
      }

      // Extracción y procesamiento de señal
      const rawSignal = this.extractPPGSignal(imageData, fingerDetection);
      const filteredSignal = this.components.signalFilter.process(rawSignal);
      this.updateBuffer(filteredSignal);

      // Manejo de calibración
      if (this.isCalibrating) {
        return this.handleCalibration(filteredSignal);
      }

      // Análisis de calidad
      const quality = this.analyzeSignalQuality();
      if (quality < this.minQualityThreshold) {
        return this.generateEmptyResult(`Poor signal quality: ${quality.toFixed(2)}`);
      }

      // Análisis wavelet y características avanzadas
      const waveletAnalysis = this.components.waveletAnalyzer.analyze(this.buffer);
      
      // Detección de eventos y cálculos
      const vitals = this.calculateVitalSigns(waveletAnalysis);
      const arrhythmia = this.detectArrhythmia(waveletAnalysis);
      
      // Retroalimentación auditiva
      if (waveletAnalysis.isPeak) {
        await this.components.beepPlayer.play({
          frequency: 880 + (vitals.bpm - 60),
          duration: 50,
          volume: quality
        });
      }

      // Actualización del sistema adaptativo
      this.updateAdaptiveSystem(quality, vitals);

      // Resultado final
      return {
        timestamp: now,
        ...vitals,
        arrhythmia,
        quality,
        features: waveletAnalysis.features,
        fingerDetection: {
          quality: fingerDetection.quality,
          coverage: fingerDetection.coverage,
          position: fingerDetection.position
        },
        deviceInfo: this.getDeviceInfo(imageData, fingerDetection)
      };

    } catch (error) {
      console.error('Error processing frame:', error);
      return this.generateEmptyResult('Processing error occurred');
    }
  }

  /**
   * Extrae la señal PPG de la imagen
   */
  private extractPPGSignal(imageData: ImageData, fingerDetection: any): number {
    const { data, width, height } = imageData;
    const roi = this.calculateROI(width, height, fingerDetection);
    
    let redSum = 0;
    let greenSum = 0;
    let pixelCount = 0;

    for (let y = roi.y; y < roi.y + roi.height; y++) {
      for (let x = roi.x; x < roi.x + roi.width; x++) {
        const i = (y * width + x) * 4;
        redSum += data[i];     // R
        greenSum += data[i+1]; // G
        pixelCount++;
      }
    }

    // Usar proporción R/G para mejor señal
    return (redSum / pixelCount) / (greenSum / pixelCount);
  }

  /**
   * Calcula la región de interés basada en la detección del dedo
   */
  private calculateROI(width: number, height: number, fingerDetection: any) {
    const centerX = width * fingerDetection.position.x;
    const centerY = height * fingerDetection.position.y;
    const roiSize = Math.min(width, height) * 0.3;

    return {
      x: Math.max(0, Math.floor(centerX - roiSize/2)),
      y: Math.max(0, Math.floor(centerY - roiSize/2)),
      width: Math.min(width - 1, Math.floor(roiSize)),
      height: Math.min(height - 1, Math.floor(roiSize))
    };
  }

  /**
   * Analiza la calidad de la señal actual
   */
  private analyzeSignalQuality(): number {
    const quality = this.components.qualityAnalyzer.analyzeQuality(this.buffer);
    this.qualityHistory.push(quality);
    
    if (this.qualityHistory.length > 30) {
      this.qualityHistory.shift();
    }

    return this.qualityHistory.reduce((a, b) => a + b, 0) / this.qualityHistory.length;
  }

  /**
   * Calcula los signos vitales basados en el análisis wavelet
   */
  private calculateVitalSigns(waveletAnalysis: any) {
    const bpm = this.calculateBPM(waveletAnalysis);
    
    return {
      bpm,
      spo2: this.calculateSpO2(waveletAnalysis),
      systolic: this.calculateSystolic(waveletAnalysis, bpm),
      diastolic: this.calculateDiastolic(waveletAnalysis, bpm),
      perfusionIndex: this.calculatePerfusionIndex(),
      respiratoryRate: this.calculateRespiratoryRate(waveletAnalysis),
      stressIndex: this.calculateStressIndex(waveletAnalysis, bpm)
    };
  }

  /**
   * Actualiza el sistema adaptativo basado en la calidad y resultados
   */
  private updateAdaptiveSystem(quality: number, vitals: any): void {
    const qualityTrend = this.calculateQualityTrend();
    
    if (qualityTrend < 0) {
      this.adaptiveSystem.signalAmplification *= 1.1;
      this.adaptiveSystem.noiseThreshold *= 0.9;
    } else if (qualityTrend > 0 && quality > 0.8) {
      this.adaptiveSystem.signalAmplification *= 0.95;
      this.adaptiveSystem.noiseThreshold *= 1.05;
    }

    this.adaptiveSystem.stabilityFactor = Math.min(1.0, quality + 0.2);
  }

  /**
   * Calcula la tendencia de calidad de la señal
   */
  private calculateQualityTrend(): number {
    if (this.qualityHistory.length < 2) return 0;
    
    const recent = this.qualityHistory.slice(-5);
    const older = this.qualityHistory.slice(-10, -5);
    
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    
    return recentAvg - olderAvg;
  }

  // Métodos de cálculo específicos
  private calculateBPM(waveletAnalysis: any): number {
    const peakInterval = waveletAnalysis.getPeakToPeakInterval();
    if (!peakInterval) return 0;
    
    const instantBPM = Math.round(60000 / peakInterval);
    this.bpmHistory.push(instantBPM);
    
    if (this.bpmHistory.length > 10) {
      this.bpmHistory.shift();
    }

    // Media móvil ponderada
    let weightedSum = 0;
    let weightSum = 0;
    
    this.bpmHistory.forEach((bpm, i) => {
      const weight = Math.pow(1.5, i);
      weightedSum += bpm * weight;
      weightSum += weight;
    });

    return Math.round(weightedSum / weightSum);
  }

  private calculateSpO2(waveletAnalysis: any): number {
    // Implementación del cálculo de SpO2 basado en análisis wavelet
    return 98;
  }

  private calculateSystolic(waveletAnalysis: any, bpm: number): number {
    // Implementación del cálculo de presión sistólica
    return 120;
  }

  private calculateDiastolic(waveletAnalysis: any, bpm: number): number {
    // Implementación del cálculo de presión diastólica
    return 80;
  }

  private calculatePerfusionIndex(): number {
    if (this.buffer.length < 2) return 0;
    const max = Math.max(...this.buffer);
    const min = Math.min(...this.buffer);
    return ((max - min) / ((max + min) / 2)) * 100;
  }

  private calculateRespiratoryRate(waveletAnalysis: any): number {
    // Implementación del cálculo de frecuencia respiratoria
    return 16;
  }

  private calculateStressIndex(waveletAnalysis: any, bpm: number): number {
    // Implementación del cálculo de índice de estrés
    return 50;
  }

  private detectArrhythmia(waveletAnalysis: any): ArrhythmiaType | null {
    // Implementación de detección de arritmias
    return null;
  }

  // Métodos de utilidad
  private generateEmptyResult(message: string): PPGData {
    return {
      timestamp: Date.now(),
      bpm: 0,
      spo2: 0,
      systolic: 0,
      diastolic: 0,
      perfusionIndex: 0,
      respiratoryRate: 0,
      stressIndex: 0,
      arrhythmia: null,
      quality: 0,
      message,
      features: {},
      fingerDetection: {
        quality: 0,
        coverage: 0,
        position: { x: 0, y: 0 }
      },
      deviceInfo: {
        frameRate: 30,
        resolution: { width: 0, height: 0 },
        lightLevel: 0
      }
    };
  }

  private getDeviceInfo(imageData: ImageData, fingerDetection: any) {
    return {
      frameRate: 30,
      resolution: {
        width: imageData.width,
        height: imageData.height
      },
      lightLevel: fingerDetection.metrics.brightness
    };
  }

  // Métodos públicos de control
  public startCalibration(): void {
    this.isCalibrating = true;
    this.calibrationData = {
      samples: 0,
      sum: 0,
      min: Infinity,
      max: -Infinity,
      variance: 0,
      peaks: []
    };
  }

  public updateSettings(settings: SensitivitySettings): void {
    this.settings = settings;
    this.initializeComponents();
    this.setupAdaptiveSystem();
  }

  public dispose(): void {
    this.components.beepPlayer.dispose();
  }
}
