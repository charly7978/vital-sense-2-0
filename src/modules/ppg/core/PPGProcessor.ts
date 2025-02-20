
import { VitalReading, PPGData } from '@/types/vitals';
import { SensitivitySettings, ProcessingSettings } from '@/types/settings';
import { BeepPlayer } from '@/utils/audio/BeepPlayer';
import { SignalProcessor } from './processors/SignalProcessor';
import { SignalExtractor } from './processors/SignalExtractor';
import { PeakDetector } from './processors/PeakDetector';
import { SignalNormalizer } from './processors/SignalNormalizer';
import { SignalFilter } from './processors/SignalFilter';
import { SignalFrequencyAnalyzer } from './processors/SignalFrequencyAnalyzer';
import { MLModel } from './ml/MLModel';
import { validateVitalSigns, validateSignalQuality } from './validation/ppgValidation';
import { defaultProcessingSettings } from './config/processingSettings';
import { defaultSensitivitySettings } from './config/sensitivitySettings';

export class PPGProcessor {
  private readings: VitalReading[] = [];
  private redBuffer: number[] = [];
  private irBuffer: number[] = [];
  private readonly samplingRate = 30;
  private readonly windowSize = 300;
  private readonly bufferSize = 30;
  private readonly qualityThreshold = 0.2;
  
  private lastValidBpm: number = 0;
  private lastValidSystolic: number = 120;
  private lastValidDiastolic: number = 80;
  private frameCount: number = 0;
  
  private readonly signalProcessor: SignalProcessor;
  private readonly signalExtractor: SignalExtractor;
  private readonly peakDetector: PeakDetector;
  private readonly signalNormalizer: SignalNormalizer;
  private readonly signalFilter: SignalFilter;
  private readonly frequencyAnalyzer: SignalFrequencyAnalyzer;
  private readonly mlModel: MLModel;
  private readonly beepPlayer: BeepPlayer;
  
  private sensitivitySettings: SensitivitySettings;
  private processingSettings: ProcessingSettings;
  
  constructor() {
    this.sensitivitySettings = defaultSensitivitySettings;
    this.processingSettings = defaultProcessingSettings;
    
    this.beepPlayer = new BeepPlayer();
    this.signalProcessor = new SignalProcessor(this.windowSize);
    this.signalExtractor = new SignalExtractor();
    this.peakDetector = new PeakDetector();
    this.signalNormalizer = new SignalNormalizer();
    this.signalFilter = new SignalFilter(this.samplingRate);
    this.frequencyAnalyzer = new SignalFrequencyAnalyzer(this.samplingRate);
    this.mlModel = new MLModel();
  }

  async processFrame(imageData: ImageData): Promise<PPGData | null> {
    this.frameCount++;
    const { red, ir, quality } = await this.extractAndValidateSignal(imageData);
    
    if (!quality.isValid) {
      return this.getEmptyReading();
    }
    
    const processedSignals = await this.processSignals(red, ir);
    const vitalSigns = await this.calculateVitalSigns(processedSignals.filteredRed, processedSignals.isPeak);
    
    if (this.frameCount % 30 === 0 && vitalSigns.bpm > 0) {
      await this.updateMLModel(vitalSigns);
    }

    return vitalSigns;
  }

  private async extractAndValidateSignal(imageData: ImageData) {
    const { red, ir, quality } = this.signalExtractor.extractChannels(imageData);
    
    const isValid = validateSignalQuality(
      quality, 
      red, 
      this.qualityThreshold, 
      this.processingSettings.MIN_RED_VALUE
    );

    return { red, ir, quality: { value: quality, isValid } };
  }

  getReadings(): VitalReading[] {
    return this.readings;
  }

  updateSensitivitySettings(settings: SensitivitySettings): void {
    this.sensitivitySettings = settings;
    console.log('Sensitivity settings updated:', settings);
  }
}
