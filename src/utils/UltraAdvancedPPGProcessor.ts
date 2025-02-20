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
  private lastCardiacAnalysisTime: number = 0;
  private readonly CARDIAC_ANALYSIS_INTERVAL = 1000; // 1 segundo entre análisis cardíacos

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
      console.log('📊 Extrayendo canal rojo...');
      const redChannel = this.extractRedChannel(frame);
      
      // Almacenar en buffer raw
      redChannel.forEach(value => this.buffers.raw.push(value));
      
      // Procesar señal
      console.log('🔄 Procesando señal...');
      const rawData = this.buffers.raw.getData();
      const smoothedSignal = this.movingAverage(rawData, 5);
      
      // Almacenar señal procesada
      smoothedSignal.forEach(value => this.buffers.processed.push(value));
      
      // Obtener últimos N puntos para análisis
      const processedData = this.buffers.processed.getData();
      const signalForAnalysis = processedData.slice(-100);
      
      // Análisis de características
      console.log('📈 Analizando características de la señal...');
      const peaks = this.findPeaks(signalForAnalysis);
      const valleys = this.findValleys(signalForAnalysis);
      const frequency = this.calculateFrequency(peaks);
      const amplitude = Math.max(...signalForAnalysis) - Math.min(...signalForAnalysis);
      const signalQuality = this.calculateSignalQuality(signalForAnalysis);
      
      console.log('📊 Calidad de la señal:', signalQuality);
      console.log('⚡ Picos detectados:', peaks.length);
      console.log('💗 Frecuencia:', frequency);

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
      
      const spo2 = signalQuality > 0.6 ? Math.round(95 + (signalQuality * 4)) : 0;
      const systolic = signalQuality > 0.7 ? Math.round(120 + (amplitude * 10)) : 0;
      const diastolic = signalQuality > 0.7 ? Math.round(80 + (amplitude * 5)) : 0;
      
      console.log('🫁 SpO2:', spo2);
      console.log('🩺 Presión:', systolic, '/', diastolic);

      const hrv = this.calculateHeartRateVariability(peaks);
      const hasArrhythmia = hrv > 0.2;

      // Crear señal procesada inicial
      const processedSignal: ProcessedPPGSignal = {
        signal: smoothedSignal,
        quality: signalQuality,
        features,
        confidence: signalQuality,
        timestamp: Date.now(),
        bpm: Math.round(bpm),
        spo2,
        systolic,
        diastolic,
        hasArrhythmia,
        arrhythmiaType: hasArrhythmia ? 'Irregular' : 'Normal',
        readings: [],
        signalQuality
      };

      // Análisis cardíaco avanzado si la calidad es buena y ha pasado suficiente tiempo
      const currentTime = Date.now();
      if (signalQuality > 0.6 && (currentTime - this.lastCardiacAnalysisTime) > this.CARDIAC_ANALYSIS_INTERVAL) {
        console.log('🔬 Iniciando análisis cardíaco avanzado...');
        const cardiacAnalysis = await this.cardiacAnalyzer.analyzeCardiacSignal(processedSignal);
        this.lastCardiacAnalysisTime = currentTime;
        
        if (cardiacAnalysis.valid && cardiacAnalysis.heartbeat) {
          console.log('✨ Análisis cardíaco exitoso:', cardiacAnalysis);
          processedSignal.hasArrhythmia = cardiacAnalysis.arrhythmia?.isCritical || false;
          processedSignal.arrhythmiaType = cardiacAnalysis.arrhythmia?.type || 'Normal';
          processedSignal.confidence = cardiacAnalysis.heartbeat.confidence;

          // El sonido y la visualización los maneja internamente CardiacAnalysisPro
        } else {
          console.warn('⚠️ Análisis cardíaco no válido:', cardiacAnalysis.reason);
        }
      } else if (signalQuality <= 0.6) {
        console.log('⚠️ Calidad insuficiente para análisis avanzado');
      }

      const reading: VitalReading = {
        timestamp: Date.now(),
        value: smoothedSignal[smoothedSignal.length - 1] || 0
      };
      processedSignal.readings = [reading];

      await this.updateFeedback(smoothedSignal, signalQuality);

      console.log('✅ Señal procesada:', processedSignal);
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
