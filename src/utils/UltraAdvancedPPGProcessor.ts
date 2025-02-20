
import { CircularBuffer } from './circularBuffer';
import { CardiacAnalysisPro } from './CardiacAnalysisPro';
import { 
  ProcessedPPGSignal, 
  SignalQuality, 
  SignalFeatures,
  DisplayConfig,
  VisualizerConfig,
  AlertConfig,
  Alert,
  SignalData,
  QualityMetrics,
  QualityIndicators,
  SensitivitySettings,
  VitalReading
} from './types';

export class UltraAdvancedPPGProcessor {
  private readonly MASTER_CONFIG = {
    quality: {
      metrics: {
        snr: {
          min: 0.5,
          max: 1.0
        }
      }
    }
  } as const;

  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1.5,
    noiseReduction: 1.2,
    peakDetection: 1.3,
    heartbeatThreshold: 0.5,
    responseTime: 1.0,
    signalStability: 0.5,
    brightness: 1.0,
    redIntensity: 1.0
  };

  private readonly buffers = {
    raw: new CircularBuffer(1024),
    processed: new CircularBuffer(1024),
    quality: new CircularBuffer(60)
  };

  private readonly feedbackSystem: {
    display: DisplayManager;
    quality: QualityVisualizer;
    alerts: AlertManager;
  };

  private cardiacAnalyzer: CardiacAnalysisPro;

  constructor() {
    this.cardiacAnalyzer = new CardiacAnalysisPro();
    this.feedbackSystem = {
      display: new DisplayManager({
        refreshRate: 60,
        interpolation: 'cubic-spline'
      }),
      quality: new QualityVisualizer({
        updateRate: 30,
        smoothing: true
      }),
      alerts: new AlertManager({
        visual: true,
        haptic: true,
        audio: true
      })
    };
  }

  updateSensitivitySettings(settings: SensitivitySettings): void {
    this.sensitivitySettings = {
      ...this.sensitivitySettings,
      ...settings
    };
  }

  async processFrame(frame: ImageData): Promise<ProcessedPPGSignal> {
    try {
      console.log('🎥 Procesando frame...');
      
      // Extraer señal PPG del frame
      const redChannel = this.extractRedChannel(frame);
      redChannel.forEach(value => this.buffers.raw.push(value));
      
      // Procesar señal
      const rawData = this.buffers.raw.getData();
      const smoothedSignal = this.movingAverage(rawData, 5);
      smoothedSignal.forEach(value => this.buffers.processed.push(value));
      
      // Obtener últimos N puntos para análisis
      const processedData = this.buffers.processed.getData();
      const signalForAnalysis = processedData.slice(-100);
      
      // Análisis de características
      const peaks = this.findPeaks(signalForAnalysis);
      const valleys = this.findValleys(signalForAnalysis);
      const frequency = this.calculateFrequency(peaks);
      const amplitude = Math.max(...signalForAnalysis) - Math.min(...signalForAnalysis);
      const signalQuality = this.calculateSignalQuality(signalForAnalysis);

      // Actualizar buffer de calidad
      this.buffers.quality.push(signalQuality);
      
      // Calcular calidad promedio
      const qualityData = this.buffers.quality.getData();
      const averageQuality = qualityData.reduce((a, b) => a + b, 0) / qualityData.length;
      
      console.log('📊 Calidad promedio de la señal:', averageQuality);

      // Características de la señal
      const features: SignalFeatures = {
        peaks,
        valleys,
        frequency,
        amplitude,
        perfusionIndex: this.calculatePerfusionIndexSafe(signalForAnalysis)
      };

      // Cálculos vitales básicos
      const bpm = frequency * 60;
      console.log('💓 BPM calculado:', bpm);
      
      const spo2 = averageQuality > 0.6 ? Math.round(95 + (averageQuality * 4)) : 0;
      const systolic = averageQuality > 0.7 ? Math.round(120 + (amplitude * 10)) : 0;
      const diastolic = averageQuality > 0.7 ? Math.round(80 + (amplitude * 5)) : 0;

      const hrv = this.calculateHeartRateVariability(peaks);
      const hasArrhythmia = hrv > 0.2;

      // Crear señal procesada inicial
      const processedSignal: ProcessedPPGSignal = {
        signal: smoothedSignal,
        quality: averageQuality,
        features,
        confidence: averageQuality,
        timestamp: Date.now(),
        bpm: Math.round(bpm),
        spo2,
        systolic,
        diastolic,
        hasArrhythmia,
        arrhythmiaType: hasArrhythmia ? 'Irregular' : 'Normal',
        readings: [],
        signalQuality: averageQuality
      };

      // Análisis cardíaco avanzado si la calidad es buena
      if (averageQuality > 0.6) {
        console.log('🔬 Iniciando análisis cardíaco avanzado...');
        const cardiacAnalysis = await this.cardiacAnalyzer.analyzeCardiacSignal(processedSignal);
        
        if (cardiacAnalysis.valid && cardiacAnalysis.heartbeat) {
          processedSignal.hasArrhythmia = cardiacAnalysis.arrhythmia?.isCritical || false;
          processedSignal.arrhythmiaType = cardiacAnalysis.arrhythmia?.type || 'Normal';
          processedSignal.confidence = cardiacAnalysis.heartbeat.confidence;
        }
      }

      const reading: VitalReading = {
        timestamp: Date.now(),
        value: smoothedSignal[smoothedSignal.length - 1] || 0
      };
      processedSignal.readings = [reading];

      // Actualizar feedback y visualización
      await this.updateFeedback(smoothedSignal, averageQuality);

      return processedSignal;
    } catch (error) {
      console.error('❌ Error en procesamiento:', error);
      throw error;
    }
  }

  private extractRedChannel(frame: ImageData): number[] {
    const redValues = [];
    for (let i = 0; i < frame.data.length; i += 4) {
      redValues.push(frame.data[i]);
    }
    return redValues;
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
    if (!data || data.length === 0) return [];
    
    const threshold = this.calculateThreshold(data);
    const peaks = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] > threshold && data[i] > data[i - 1] && data[i] > data[i + 1]) {
        peaks.push(i);
      }
    }
    return peaks;
  }

  private calculateThreshold(data: number[]): number {
    if (!data || data.length === 0) return 0;
    
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const stdDev = Math.sqrt(
      data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length
    );
    return mean + 0.5 * stdDev;
  }

  private findValleys(data: number[]): number[] {
    if (!data || data.length === 0) return [];
    
    const threshold = this.calculateThreshold(data);
    const valleys = [];
    
    for (let i = 1; i < data.length - 1; i++) {
      if (data[i] < threshold && data[i] < data[i - 1] && data[i] < data[i + 1]) {
        valleys.push(i);
      }
    }
    return valleys;
  }

  private calculateFrequency(peaks: number[]): number {
    if (!peaks || peaks.length < 2) return 0;
    
    let totalDistance = 0;
    for (let i = 1; i < peaks.length; i++) {
      totalDistance += peaks[i] - peaks[i - 1];
    }
    
    const averageDistance = totalDistance / (peaks.length - 1);
    return averageDistance > 0 ? (30 / averageDistance) : 0;
  }

  private calculateSignalQuality(signal: number[]): number {
    if (!signal || signal.length === 0) return 0;

    const mean = signal.reduce((a, b) => a + b, 0) / signal.length;
    const variance = signal.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / signal.length;
    const snr = variance > 0 ? Math.abs(mean) / Math.sqrt(variance) : 0;
    
    return Math.min(Math.max(snr / 10, 0), 1);
  }

  private calculateHeartRateVariability(peaks: number[]): number {
    if (!peaks || peaks.length < 2) return 0;
    
    const intervals = [];
    for (let i = 1; i < peaks.length; i++) {
      intervals.push(peaks[i] - peaks[i-1]);
    }
    
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    return Math.sqrt(variance) / mean;
  }

  private calculatePerfusionIndexSafe(signal: number[]): number {
    if (!signal || signal.length === 0) return 0;
    
    const max = Math.max(...signal);
    const min = Math.min(...signal);
    const dc = signal.reduce((a, b) => a + b, 0) / signal.length;
    
    if (dc === 0) return 0;
    const ac = max - min;
    return (ac / dc) * 100;
  }

  private async updateFeedback(signal: number[], quality: number): Promise<void> {
    await this.feedbackSystem.display.updateSignal({
      signal,
      quality: {
        snr: quality,
        stability: 1.0,
        artifacts: 1.0,
        overall: quality
      },
      timestamp: Date.now()
    });

    if (quality < this.MASTER_CONFIG.quality.metrics.snr.min) {
      await this.feedbackSystem.alerts.show({
        type: 'quality',
        message: 'Calidad de señal baja',
        suggestion: 'Ajuste la posición del dedo',
        priority: 'high',
        timestamp: Date.now()
      });
    }
  }
}

class DisplayManager {
  constructor(config: DisplayConfig) {}

  async updateSignal(data: SignalData): Promise<void> {
    console.log('Actualizando display:', data);
  }
}

class QualityVisualizer {
  constructor(config: VisualizerConfig) {}

  async update(metrics: QualityMetrics): Promise<void> {
    console.log('Actualizando métricas de calidad:', metrics);
  }
}

class AlertManager {
  constructor(config: AlertConfig) {}

  async show(alert: Alert): Promise<void> {
    console.log('Mostrando alerta:', alert);
  }
}
