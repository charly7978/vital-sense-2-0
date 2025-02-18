// src/lib/BeepPlayer.ts

export class BeepPlayer {
  private readonly audioContext: AudioContext;
  private readonly masterGain: GainNode;
  private readonly compressor: DynamicsCompressorNode;
  private readonly filter: BiquadFilterNode;
  
  // Configuración de sonido
  private readonly config = {
    frequency: 880, // Hz (A5)
    duration: 50,   // ms
    fadeTime: 15,   // ms
    volume: 0.3,    // 0-1
    filterQ: 8.0,   // Factor Q del filtro
    
    // Compresión de audio
    compression: {
      threshold: -24,    // dB
      knee: 30,         // dB
      ratio: 12,        // Ratio de compresión
      attack: 0.003,    // segundos
      release: 0.25     // segundos
    },
    
    // Modulación
    modulation: {
      frequency: 3,     // Hz
      depth: 10,        // Hz
      waveform: 'sine'  // tipo de onda
    }
  };

  // Control de estado
  private isPlaying = false;
  private lastPlayTime = 0;
  private playCount = 0;
  private readonly minInterval = 200; // ms entre beeps

  // Sistema de adaptación
  private readonly adaptiveSystem = {
    volumeMultiplier: 1.0,
    frequencyShift: 0,
    lastVolume: this.config.volume,
    volumeHistory: new Array<number>(),
    maxHistory: 50
  };

  constructor() {
    // Inicializar contexto de audio
    this.audioContext = new AudioContext();
    
    // Crear nodo de ganancia maestro
    this.masterGain = this.audioContext.createGain();
    this.masterGain.gain.value = 0;
    
    // Crear compresor
    this.compressor = this.audioContext.createDynamicsCompressor();
    this.configureCompressor();
    
    // Crear filtro
    this.filter = this.audioContext.createBiquadFilter();
    this.configureFilter();
    
    // Conectar nodos de audio
    this.filter.connect(this.compressor);
    this.compressor.connect(this.masterGain);
    this.masterGain.connect(this.audioContext.destination);
    
    // Inicializar sistema adaptativo
    this.initializeAdaptiveSystem();
  }

  private configureCompressor(): void {
    const comp = this.config.compression;
    this.compressor.threshold.value = comp.threshold;
    this.compressor.knee.value = comp.knee;
    this.compressor.ratio.value = comp.ratio;
    this.compressor.attack.value = comp.attack;
    this.compressor.release.value = comp.release;
  }

  private configureFilter(): void {
    this.filter.type = 'bandpass';
    this.filter.frequency.value = this.config.frequency;
    this.filter.Q.value = this.config.filterQ;
  }

  private initializeAdaptiveSystem(): void {
    // Detectar condiciones del sistema
    this.detectSystemConditions().then(conditions => {
      this.adaptToSystemConditions(conditions);
    });

    // Monitorear cambios en el contexto de audio
    this.audioContext.addEventListener('statechange', () => {
      this.handleAudioContextStateChange();
    });
  }

  public async play(options: {
    intensity?: number;
    urgency?: number;
    pattern?: 'single' | 'double' | 'triple';
  } = {}): Promise<boolean> {
    // Verificar intervalo mínimo
    const now = Date.now();
    if (now - this.lastPlayTime < this.minInterval) {
      return false;
    }

    // Verificar y reanudar contexto si es necesario
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }

    // Evitar reproducción simultánea
    if (this.isPlaying) {
      return false;
    }

    try {
      this.isPlaying = true;
      
      // Aplicar adaptaciones
      const adaptedOptions = this.adaptOptions(options);
      
      // Crear y reproducir el sonido
      await this.generateSound(adaptedOptions);
      
      // Actualizar estado
      this.lastPlayTime = now;
      this.playCount++;
      
      // Actualizar sistema adaptativo
      this.updateAdaptiveSystem();
      
      return true;
    } catch (error) {
      console.error('Error playing sound:', error);
      return false;
    } finally {
      this.isPlaying = false;
    }
  }

  private async generateSound(options: {
    intensity: number;
    urgency: number;
    pattern: 'single' | 'double' | 'triple';
  }): Promise<void> {
    const baseFrequency = this.config.frequency + this.adaptiveSystem.frequencyShift;
    const volume = this.config.volume * this.adaptiveSystem.volumeMultiplier * options.intensity;

    // Crear oscilador
    const oscillator = this.audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = baseFrequency;

    // Crear modulador de frecuencia
    const modulator = this.audioContext.createOscillator();
    const modulatorGain = this.audioContext.createGain();
    modulator.frequency.value = this.config.modulation.frequency;
    modulatorGain.gain.value = this.config.modulation.depth;

    // Conectar modulación
    modulator.connect(modulatorGain);
    modulatorGain.connect(oscillator.frequency);

    // Crear envolvente
    const envelope = this.audioContext.createGain();
    envelope.gain.value = 0;

    // Conectar oscilador
    oscillator.connect(envelope);
    envelope.connect(this.filter);

    // Iniciar osciladores
    const startTime = this.audioContext.currentTime;
    modulator.start(startTime);
    oscillator.start(startTime);

    // Aplicar patrón
    switch (options.pattern) {
      case 'double':
        await this.playDoubleBeep(envelope, volume, startTime);
        break;
      case 'triple':
        await this.playTripleBeep(envelope, volume, startTime);
        break;
      default:
        await this.playSingleBeep(envelope, volume, startTime);
    }

    // Programar limpieza
    const stopTime = startTime + (this.config.duration * 3 / 1000);
    oscillator.stop(stopTime);
    modulator.stop(stopTime);

    // Limpiar nodos
    setTimeout(() => {
      oscillator.disconnect();
      modulator.disconnect();
      modulatorGain.disconnect();
      envelope.disconnect();
    }, this.config.duration * 3);
  }

  private async playSingleBeep(
    envelope: GainNode,
    volume: number,
    startTime: number
  ): Promise<void> {
    const fadeTime = this.config.fadeTime / 1000;
    const duration = this.config.duration / 1000;

    envelope.gain.setValueAtTime(0, startTime);
    envelope.gain.linearRampToValueAtTime(volume, startTime + fadeTime);
    envelope.gain.setValueAtTime(volume, startTime + duration - fadeTime);
    envelope.gain.linearRampToValueAtTime(0, startTime + duration);

    await this.wait(this.config.duration);
  }

  private async playDoubleBeep(
    envelope: GainNode,
    volume: number,
    startTime: number
  ): Promise<void> {
    await this.playSingleBeep(envelope, volume, startTime);
    await this.wait(this.config.duration / 2);
    await this.playSingleBeep(envelope, volume * 0.8, startTime + (this.config.duration * 1.5 / 1000));
  }

  private async playTripleBeep(
    envelope: GainNode,
    volume: number,
    startTime: number
  ): Promise<void> {
    await this.playSingleBeep(envelope, volume, startTime);
    await this.wait(this.config.duration / 2);
    await this.playSingleBeep(envelope, volume * 0.8, startTime + (this.config.duration * 1.5 / 1000));
    await this.wait(this.config.duration / 2);
    await this.playSingleBeep(envelope, volume * 0.6, startTime + (this.config.duration * 3 / 1000));
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private adaptOptions(options: Partial<{
    intensity: number;
    urgency: number;
    pattern: 'single' | 'double' | 'triple';
  }> = {}): {
    intensity: number;
    urgency: number;
    pattern: 'single' | 'double' | 'triple';
  } {
    return {
      intensity: Math.min(1, Math.max(0.1, options.intensity ?? 1)),
      urgency: Math.min(1, Math.max(0, options.urgency ?? 0.5)),
      pattern: options.pattern ?? 'single'
    };
  }

  private async detectSystemConditions(): Promise<{
    isLowLatency: boolean;
    isHighPerformance: boolean;
    hasAudioFocus: boolean;
  }> {
    const conditions = {
      isLowLatency: false,
      isHighPerformance: false,
      hasAudioFocus: true
    };

    // Detectar latencia
    if ('baseLatency' in this.audioContext) {
      conditions.isLowLatency = this.audioContext.baseLatency < 0.005;
    }

    // Detectar rendimiento
    try {
      const cpu = await this.measureCPUCapability();
      conditions.isHighPerformance = cpu > 0.7;
    } catch {
      conditions.isHighPerformance = true; // Asumir lo mejor si no se puede medir
    }

    return conditions;
  }

  private async measureCPUCapability(): Promise<number> {
    const startTime = performance.now();
    let operations = 0;
    
    while (performance.now() - startTime < 5) {
      Math.sin(operations++);
    }
    
    return Math.min(1, operations / 100000);
  }

  private adaptToSystemConditions(conditions: {
    isLowLatency: boolean;
    isHighPerformance: boolean;
    hasAudioFocus: boolean;
  }): void {
    if (!conditions.isLowLatency) {
      this.config.fadeTime *= 1.5;
      this.minInterval += 50;
    }

    if (!conditions.isHighPerformance) {
      this.config.modulation.depth *= 0.5;
      this.config.filterQ *= 0.7;
    }

    if (!conditions.hasAudioFocus) {
      this.adaptiveSystem.volumeMultiplier *= 1.2;
    }
  }

  private updateAdaptiveSystem(): void {
    // Actualizar historial de volumen
    this.adaptiveSystem.volumeHistory.push(this.adaptiveSystem.lastVolume);
    if (this.adaptiveSystem.volumeHistory.length > this.adaptiveSystem.maxHistory) {
      this.adaptiveSystem.volumeHistory.shift();
    }

    // Ajustar multiplicador de volumen
    const averageVolume = this.calculateAverageVolume();
    if (averageVolume < 0.2) {
      this.adaptiveSystem.volumeMultiplier *= 1.1;
    } else if (averageVolume > 0.8) {
      this.adaptiveSystem.volumeMultiplier *= 0.9;
    }

    // Ajustar desplazamiento de frecuencia
    if (this.playCount % 10 === 0) {
      this.adaptiveSystem.frequencyShift = Math.random() * 20 - 10;
    }
  }

  private calculateAverageVolume(): number {
    if (this.adaptiveSystem.volumeHistory.length === 0) return 0;
    return this.adaptiveSystem.volumeHistory.reduce((a, b) => a + b, 0) / 
           this.adaptiveSystem.volumeHistory.length;
  }

  private async handleAudioContextStateChange(): Promise<void> {
    if (this.audioContext.state === 'interrupted') {
      await this.wait(100);
      try {
        await this.audioContext.resume();
      } catch (error) {
        console.error('Error resuming AudioContext:', error);
      }
    }
  }

  public dispose(): void {
    this.audioContext.close();
  }
}
