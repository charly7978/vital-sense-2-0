import { CircularBuffer } from './circularBuffer';
import { SpectralAnalyzer } from './spectralAnalyzer';
import { QualityAnalyzer } from './qualityAnalyzer';
import { LowLightEnhancer } from './lowLightEnhancer';
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
  SensitivitySettings
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

  // SISTEMAS PRINCIPALES
  private readonly systems = {
    spectral: new SpectralAnalyzer({}),
    lowLight: new LowLightEnhancer({}),
    quality: new QualityAnalyzer({})
  };

  // BUFFERS OPTIMIZADOS
  private readonly buffers = {
    raw: new CircularBuffer(1024),
    processed: new CircularBuffer(1024),
    quality: new CircularBuffer(60)
  };

  // SISTEMA DE RETROALIMENTACIÓN
  private readonly feedbackSystem: {
    display: DisplayManager;
    quality: QualityVisualizer;
    alerts: AlertManager;
  };

  constructor() {
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
    // Actualizar configuraciones en subsistemas
    this.systems.spectral.updateSettings(this.sensitivitySettings);
    this.systems.lowLight.updateSettings(this.sensitivitySettings);
    this.systems.quality.updateSettings(this.sensitivitySettings);
  }

  async processFrame(frame: ImageData): Promise<ProcessedPPGSignal> {
    try {
      // Análisis espectral
      const spectralData = await this.systems.spectral.analyze(frame, {});
      
      // Análisis de calidad
      const quality: SignalQuality = {
        snr: spectralData.quality,
        stability: this.calculateStability(spectralData.signal),
        artifacts: this.detectArtifacts(spectralData.signal),
        overall: spectralData.quality
      };

      // Actualizar feedback
      await this.updateFeedback(spectralData.signal, quality);

      return {
        signal: spectralData.signal,
        quality,
        features: spectralData.features,
        confidence: quality.overall,
        timestamp: Date.now(),
        bpm: 0,
        spo2: 0,
        systolic: 0,
        diastolic: 0,
        hasArrhythmia: false,
        arrhythmiaType: '',
        readings: [],
        signalQuality: quality.overall
      };
    } catch (error) {
      console.error('Error en procesamiento:', error);
      throw error;
    }
  }

  private calculateStability(signal: number[]): number {
    if (!signal.length) return 0;
    const variance = this.calculateVariance(signal);
    return Math.max(0, 1 - variance);
  }

  private calculateVariance(data: number[]): number {
    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const squaredDiffs = data.map(x => Math.pow(x - mean, 2));
    return squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
  }

  private detectArtifacts(signal: number[]): number {
    // Implementación básica de detección de artefactos
    return 1.0;
  }

  private async updateFeedback(signal: number[], quality: SignalQuality): Promise<void> {
    await this.feedbackSystem.display.updateSignal({
      signal,
      quality,
      timestamp: Date.now()
    });

    await this.feedbackSystem.quality.update(quality);

    if (quality.overall < this.MASTER_CONFIG.quality.metrics.snr.min) {
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
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: DisplayConfig;

  constructor(config: DisplayConfig) {
    this.config = config;
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d')!;
    this.setupCanvas();
  }

  private setupCanvas(): void {
    this.canvas.width = 300;
    this.canvas.height = 150;
  }

  async updateSignal(data: SignalData): Promise<void> {
    if (!data.signal) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawInterpolatedSignal(data.signal);
    if (data.quality) {
      this.drawQualityIndicators(data.quality);
    }
  }

  private drawInterpolatedSignal(signal: number[]): void {
    this.ctx.beginPath();
    this.ctx.strokeStyle = '#ea384c';
    this.ctx.lineWidth = 2;

    for (let i = 0; i < signal.length; i++) {
      const x = (i / signal.length) * this.canvas.width;
      const y = ((1 - signal[i]) * this.canvas.height) / 2;
      
      if (i === 0) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    }
    
    this.ctx.stroke();
  }

  private drawQualityIndicators(quality: SignalQuality): void {
    // Implementación básica de indicadores de calidad
    const size = 10;
    const color = quality.overall > 0.7 ? '#10b981' : quality.overall > 0.4 ? '#f59e0b' : '#ef4444';
    
    this.ctx.fillStyle = color;
    this.ctx.fillRect(this.canvas.width - size - 5, 5, size, size);
  }
}

class QualityVisualizer {
  private config: VisualizerConfig;
  private indicators: QualityIndicators;

  constructor(config: VisualizerConfig) {
    this.config = config;
    this.indicators = this.initializeIndicators();
  }

  private initializeIndicators(): QualityIndicators {
    return {
      snr: { setValue: () => {} },
      stability: { setValue: () => {} },
      artifacts: { setValue: () => {} },
      overall: { setValue: () => {} }
    };
  }

  async update(metrics: QualityMetrics): Promise<void> {
    this.updateIndicators(metrics);
  }

  private updateIndicators(metrics: QualityMetrics): void {
    Object.entries(metrics).forEach(([key, value]) => {
      if (key in this.indicators) {
        this.indicators[key as keyof QualityIndicators].setValue(value);
      }
    });
  }
}

class AlertManager {
  private config: AlertConfig;
  private activeAlerts: Alert[] = [];

  constructor(config: AlertConfig) {
    this.config = config;
  }

  async show(alert: Alert): Promise<void> {
    if (this.isDuplicate(alert)) return;
    
    this.activeAlerts.push(alert);
    await this.displayAlert(alert);
  }

  private isDuplicate(alert: Alert): boolean {
    return this.activeAlerts.some(a => 
      a.type === alert.type && 
      a.message === alert.message &&
      Date.now() - a.timestamp < 3000
    );
  }

  private async displayAlert(alert: Alert): Promise<void> {
    if (this.config.visual) {
      console.log('Alert:', alert.message);
    }

    if (this.config.haptic && navigator.vibrate) {
      navigator.vibrate(200);
    }

    if (this.config.audio) {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1UVWVwfYiVoaqvtLS0r6qkm5MGAAAAAQEBAQEBAQEBAQEBAQEBAgEBAQECAQECAQECAQIBAgECAgICAgECAgICAgICAgMCAgMCAwICAwMDAgMDAwMDAwMEAwQDBAMEBAQEBAQEBAQFBAUEBQQFBQUFBQUGBQYFBgUGBgYGBgYHBgcGBwYHBwcHBwcIBwgHCAcICAgICAgJCAkICQgJCQkJCQkKCQoJCgkKCgoKCgoLCgsKCwoLCwsLCwsMCwwLDAsM');
      await audio.play();
    }
  }

  private getAlertElement(alert: Alert): HTMLElement {
    const element = document.createElement('div');
    element.className = 'fixed bottom-4 right-4 bg-black/80 text-white px-4 py-2 rounded-lg shadow-lg';
    element.textContent = alert.message;
    return element;
  }
}
