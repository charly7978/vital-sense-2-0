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
      // Control de frecuencia de procesamiento
      if (now - this.lastProcessingTime < this.minProcessingInterval) {
        return null;
      }
      this.lastProcessingTime = now;

      // Extracción de señales de los canales de color
      const extractionResult = this.signalExtractor.extractChannels(imageData);
      const { red, ir, quality, diagnostics } = extractionResult;
      
      // Log detallado del frame procesado
      console.log('Frame procesado:', {
        timestamp: now,
        frameInterval: now - this.lastProcessingTime,
        rawRedValue: red.toFixed(3),
        signalQuality: (quality * 100).toFixed(1) + '%',
        pixelesValidos: diagnostics.validPixels,
        variacionRojo: diagnostics.rawRedValues.length > 0 ? 
          (Math.max(...diagnostics.rawRedValues) - Math.min(...diagnostics.rawRedValues)).toFixed(3) : 'N/A'
      });
      
      // Validación de calidad de señal
      if (quality < this.qualityThreshold || red < this.processingSettings.MIN_RED_VALUE) {
        console.log('Señal insuficiente:', {
          calidad: (quality * 100).toFixed(1) + '%',
          valorRojo: red.toFixed(1),
          umbralCalidad: (this.qualityThreshold * 100).toFixed(1) + '%',
          umbralRojo: this.processingSettings.MIN_RED_VALUE
        });
        return null;
      }
      
      // Amplificación y procesamiento de señal
      const amplifiedRed = red * this.sensitivitySettings.signalAmplification;
      const amplifiedIr = ir * this.sensitivitySettings.signalAmplification;
      
      this.redBuffer.push(amplifiedRed);
      this.irBuffer.push(amplifiedIr);
      
      // Filtrado y normalización
      const filteredRed = this.signalFilter.lowPassFilter(this.redBuffer, 
        5 * this.sensitivitySettings.noiseReduction);
      const normalizedValue = this.signalNormalizer.normalizeSignal(
        filteredRed[filteredRed.length - 1]
      );
      
      // Almacenamiento de lecturas
      this.readings.push({ timestamp: now, value: normalizedValue });
      this.signalBuffer.push(normalizedValue);

      // Limpieza de datos antiguos
      this.dataManager.cleanupData(
        this.readings,
        this.redBuffer,
        this.irBuffer,
        this.peakTimes,
        this.signalBuffer,
        this.windowSize,
        this.bufferSize
      );

      // Detección de picos (latidos)
      const isPeak = this.peakDetector.isRealPeak(normalizedValue, now, this.signalBuffer);

      if (isPeak) {
        this.peakTimes.push(now);
        try {
          await this.beepPlayer.playBeep('heartbeat');
        } catch (error) {
          console.error('Error reproduciendo beep:', error);
        }
      }

      // Análisis de frecuencia para BPM
      const { frequencies, magnitudes } = this.frequencyAnalyzer.performFFT(filteredRed);
      const dominantFreqIndex = magnitudes.indexOf(Math.max(...magnitudes));
      const dominantFreq = frequencies[dominantFreqIndex];
      const calculatedBpm = dominantFreq * 60;
      
      // Cálculo de intervalos RR para HRV
      const intervals = [];
      for (let i = 1; i < this.peakTimes.length; i++) {
        intervals.push(this.peakTimes[i] - this.peakTimes[i-1]);
      }
      
      // Análisis de signos vitales
      const hrvAnalysis = this.signalProcessor.analyzeHRV(intervals);
      const spo2Result = this.signalProcessor.calculateSpO2(this.redBuffer, this.irBuffer);
      const bp = this.signalProcessor.estimateBloodPressure(filteredRed, this.peakTimes);
      const validatedVitals = this.vitalsValidator.validateVitalSigns(calculatedBpm, bp.systolic, bp.diastolic);

      // Log de mediciones calculadas
      console.log('Mediciones calculadas:', {
        bpm: validatedVitals.bpm,
        spo2: spo2Result.spo2,
        presion: `${validatedVitals.systolic}/${validatedVitals.diastolic}`,
        intervalosRR: intervals.length,
        confianza: spo2Result.confidence
      });

      // Retorno de resultados procesados
      return {
        bpm: validatedVitals.bpm,
        spo2: Math.min(100, Math.max(75, spo2Result.spo2)),
        systolic: validatedVitals.systolic,
        diastolic: validatedVitals.diastolic,
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
    } catch (error) {
      console.error('Error procesando frame:', error);
      return null;
    }
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
