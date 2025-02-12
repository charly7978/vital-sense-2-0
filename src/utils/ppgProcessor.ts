import { VitalReading, PPGData, SensitivitySettings, ProcessingSettings } from './types';
import { BeepPlayer } from './audioUtils';
import { SignalProcessor } from './signalProcessing';
import { SignalExtractor } from './signalExtraction';
import { PeakDetector } from './peakDetection';
import { SignalNormalizer } from './signalNormalization';
import { SignalFilter } from './signalFilter';
import { SignalFrequencyAnalyzer } from './signalFrequencyAnalyzer';
import { MLModel } from './mlModel';
import { VitalsValidator } from './vitalsValidator';
import { PPGDataManager } from './ppgDataManager';

/**
 * Clase principal para el procesamiento de señales PPG (Fotopletismografía)
 * Esta clase coordina todo el proceso de análisis de señales del pulso cardíaco
 * capturadas a través de la cámara del dispositivo.
 */
export class PPGProcessor {
  // Arrays para almacenar datos históricos
  private readings: VitalReading[] = [];          // Lecturas procesadas
  private redBuffer: number[] = [];               // Buffer del canal rojo
  private irBuffer: number[] = [];                // Buffer del canal infrarrojo
  private peakTimes: number[] = [];               // Tiempos de los picos detectados
  private signalBuffer: number[] = [];            // Buffer de señal normalizada

  // Constantes de configuración críticas
  private readonly samplingRate = 30;             // Tasa de muestreo en Hz
  private readonly windowSize = 90;               // Tamaño de la ventana de análisis
  private readonly bufferSize = 15;               // Tamaño del buffer de señal
  private readonly qualityThreshold = 0.5;        // Umbral mínimo de calidad de señal
  private readonly minProcessingInterval = 50;    // Intervalo mínimo entre procesamiento (ms)

  // Instancias de procesadores especializados
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private readonly vitalsValidator: VitalsValidator;
  private readonly dataManager: PPGDataManager;
  private beepPlayer: BeepPlayer;
  private mlModel: MLModel;

  // Control de tiempo
  private lastProcessingTime: number = 0;

  /**
   * Configuración de sensibilidad para el procesamiento de señal
   * Estos valores pueden ajustarse para optimizar la detección
   */
  private sensitivitySettings: SensitivitySettings = {
    signalAmplification: 1.5,     // Amplificación de la señal raw
    noiseReduction: 1.2,          // Factor de reducción de ruido
    peakDetection: 1.3            // Sensibilidad en la detección de picos
  };
  
  /**
   * Configuración de parámetros del procesamiento
   * IMPORTANTE: Estos valores han sido calibrados cuidadosamente
   * Modificarlos puede afectar la precisión de las mediciones
   */
  private processingSettings: ProcessingSettings = {
    MEASUREMENT_DURATION: 30,          // Duración de la medición en segundos
    MIN_FRAMES_FOR_CALCULATION: 15,    // Mínimo de frames para calcular
    MIN_PEAKS_FOR_VALID_HR: 2,        // Mínimo de picos para HR válido
    MIN_PEAK_DISTANCE: 500,           // Distancia mínima entre picos (ms)
    MAX_PEAK_DISTANCE: 1000,          // Distancia máxima entre picos (ms)
    PEAK_THRESHOLD_FACTOR: 0.6,       // Factor de umbral para detección de picos
    MIN_RED_VALUE: 30,                // Valor mínimo del canal rojo
    MIN_RED_DOMINANCE: 1.5,           // Dominancia mínima del canal rojo
    MIN_VALID_PIXELS_RATIO: 0.35,      // Ratio mínimo de píxeles válidos
    MIN_BRIGHTNESS: 80,               // Brillo mínimo requerido
    MIN_VALID_READINGS: 30,           // Mínimo de lecturas válidas
    FINGER_DETECTION_DELAY: 500,      // Retardo en detección de dedo (ms)
    MIN_SPO2: 80                      // SpO2 mínimo válido
  };
  
  /**
   * Constructor: inicializa todos los componentes necesarios
   * para el procesamiento de la señal PPG
   */
  constructor() {
    console.log('Inicializando PPGProcessor...');
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
    this.signalExtractor = new SignalExtractor();
    this.peakDetector = new PeakDetector();
    this.signalNormalizer = new SignalNormalizer();
    this.signalFilter = new SignalFilter(this.samplingRate);
    this.frequencyAnalyzer = new SignalFrequencyAnalyzer(this.samplingRate);
    this.mlModel = new MLModel();
    this.vitalsValidator = new VitalsValidator();
    this.dataManager = new PPGDataManager();
  }

  /**
   * Procesa un frame de video para extraer información vital
   * @param imageData - Datos de la imagen del frame actual
   * @returns PPGData | null - Datos procesados o null si no hay señal válida
   */
  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    const now = Date.now();

    try {
      if (now - this.lastProcessingTime < this.minProcessingInterval) {
        return null;
      }
      this.lastProcessingTime = now;

      // 🔴 **Paso 1: Extraer la señal**
      const extractionResult = this.signalExtractor.extractChannels(imageData);
      const { red, ir, quality, diagnostics } = extractionResult;

      console.log("🔍 Datos extraídos:", {
        red,
        ir,
        calidad: (quality * 100).toFixed(1) + "%",
        variacionRojo: diagnostics.rawRedValues.length > 0 
          ? (Math.max(...diagnostics.rawRedValues) - Math.min(...diagnostics.rawRedValues)).toFixed(3) 
          : "N/A"
      });

      // 🔴 **Paso 2: Validar presencia de dedo**
      if (red < this.processingSettings.MIN_RED_VALUE) {
        console.log(`⚠ No se detecta el dedo. Rojo detectado: ${red}`);
        return null;
      }

      // 🔴 **Paso 3: Verificar calidad de señal**
      if (quality < 0.5) {
        console.log(`⚠ Señal de baja calidad (${(quality * 100).toFixed(1)}%). Probando ajuste...`);
        // Permitimos medición con ajustes menores si la calidad es entre 0.3 y 0.5
        if (quality >= 0.3) {
          console.log("🔧 Ajuste menor aplicado. Intentando medir...");
        } else {
          return null;
        }
      }

      // 🔴 **Paso 4: Comprobar variación en la señal**
      const redVariation = Math.max(...this.redBuffer) - Math.min(...this.redBuffer);
      if (redVariation < 5) {
        console.log("⚠ Variación mínima en la señal. Puede ser luz ambiental.");
        return null;
      }

      // ✅ **Ajustes en Sensibilidad**
      const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
      const amplifiedIr = ir * this.sensitivitySettings.signalAmplification;

      this.redBuffer.push(amplifiedRed);
      this.irBuffer.push(amplifiedIr);

      // Procesamiento de señal mejorado
      const filteredRed = this.signalFilter.lowPassFilter(this.redBuffer, 
        4 * this.sensitivitySettings.noiseReduction);
      const normalizedValue = this.signalNormalizer.normalizeSignal(
        filteredRed[filteredRed.length - 1]
      );

      // Almacenamiento de lecturas
      this.readings.push({ timestamp: now, value: normalizedValue });
      this.signalBuffer.push(normalizedValue);

      // Detección de picos
      const isPeak = this.peakDetector.isRealPeak(
        normalizedValue,
        now,
        this.signalBuffer
      );

      if (isPeak) {
        this.peakTimes.push(now);
        await this.beepPlayer.playBeep('heartbeat').catch(console.error);
      }

      // Cálculo de métricas vitales
      const spo2Result = this.signalProcessor.calculateSpO2(
        this.redBuffer,
        this.irBuffer
      );

      const hrvIntervals = [];
      for (let i = 1; i < this.peakTimes.length; i++) {
        hrvIntervals.push(this.peakTimes[i] - this.peakTimes[i-1]);
      }

      const hrvAnalysis = this.signalProcessor.analyzeHRV(hrvIntervals);
      const bpEstimation = this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);
      const bpm = this.calculateInstantaneousBPM(this.peakTimes);

      // Limpieza de buffers
      this.dataManager.cleanupData(
        this.readings,
        this.redBuffer,
        this.irBuffer,
        this.peakTimes,
        this.signalBuffer,
        this.windowSize,
        this.bufferSize
      );

      console.log(`✔ Medición válida: BPM=${bpm}, SpO₂=${spo2Result.spo2}%`);

      const result: PPGData = {
        bpm,
        spo2: spo2Result.spo2,
        systolic: bpEstimation.systolic,
        diastolic: bpEstimation.diastolic,
        hasArrhythmia: hrvAnalysis.hasArrhythmia,
        arrhythmiaType: hrvAnalysis.type,
        signalQuality: quality,
        confidence: spo2Result.confidence,
        readings: this.readings,
        isPeak,
        redValue: red,
        rawDiagnostics: diagnostics,
        hrvMetrics: {
          sdnn: hrvAnalysis.sdnn,
          rmssd: hrvAnalysis.rmssd,
          pnn50: hrvAnalysis.pnn50,
          lfhf: hrvAnalysis.lfhf
        }
      };

      return result;

    } catch (error) {
      console.error("❌ Error procesando frame:", error);
      return null;
    }
  }

  private calculateInstantaneousBPM(peakTimes: number[]): number {
    if (peakTimes.length < 2) return 0;
    
    // Usar los últimos 4 intervalos para un cálculo más estable
    const recentPeaks = peakTimes.slice(-5);
    const intervals = [];
    
    for (let i = 1; i < recentPeaks.length; i++) {
      const interval = recentPeaks[i] - recentPeaks[i-1];
      if (interval >= this.processingSettings.MIN_PEAK_DISTANCE && 
          interval <= this.processingSettings.MAX_PEAK_DISTANCE) {
        intervals.push(interval);
      }
    }
    
    if (intervals.length === 0) return 0;
    
    // Calcular la media de los intervalos válidos
    const averageInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const bpm = Math.round(60000 / averageInterval); // Convertir a BPM
    
    return Math.min(Math.max(bpm, 40), 200); // Límites fisiológicos
  }

  /**
   * Obtiene el historial de lecturas
   * @returns VitalReading[] - Array de lecturas almacenadas
   */
  getReadings(): VitalReading[] {
    return this.readings;
  }

  /**
   * Actualiza la configuración de sensibilidad
   * @param settings - Nueva configuración de sensibilidad
   */
  updateSensitivitySettings(settings: SensitivitySettings) {
    this.sensitivitySettings = settings;
  }
}
