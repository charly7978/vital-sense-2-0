// ==================== audioUtils.ts ====================

export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lastBeepTime: number = 0;
  private readonly minBeepInterval = 300;

  constructor() {
    // Inicializar bajo demanda para móviles
    this.initAudioContext = this.initAudioContext.bind(this);
    document.addEventListener('touchstart', this.initAudioContext, { once: true });
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat', volumeMultiplier: number = 1) {
    const now = Date.now();
    if (now - this.lastBeepTime < this.minBeepInterval) {
      console.log('⚠ Beep ignorado: demasiado pronto');
      return;
    }

    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      // Crear nodos de audio
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();
      this.filterNode = this.audioContext.createBiquadFilter();

      // Configurar filtro para sonido médico
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.value = 1000;
      this.filterNode.Q.value = 10;

      // Configurar oscilador
      this.oscillator.type = 'sine';
      const now = this.audioContext.currentTime;
      this.oscillator.frequency.setValueAtTime(660, now);
      this.oscillator.frequency.linearRampToValueAtTime(440, now + 0.03);

      // Envelope para sonido de monitor cardíaco
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(0.4 * volumeMultiplier, now + 0.01);
      this.gainNode.gain.linearRampToValueAtTime(0.2 * volumeMultiplier, now + 0.02);
      this.gainNode.gain.linearRampToValueAtTime(0, now + 0.05);

      // Conectar nodos
      this.oscillator.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Reproducir
      this.oscillator.start(now);
      this.oscillator.stop(now + 0.05);

      this.lastBeepTime = Date.now();

      // Log para debugging
      console.log('🫀 Beep reproducido:', {
        tipo: type,
        tiempo: now,
        volumen: volumeMultiplier
      });

      // Limpiar después de reproducir
      setTimeout(() => {
        this.cleanup();
      }, 100);

    } catch (error) {
      console.error('Error reproduciendo beep:', error);
      this.cleanup();
    }
  }

  private cleanup() {
    if (this.oscillator) {
      try {
        this.oscillator.disconnect();
        this.oscillator = null;
      } catch (error) {
        console.error('Error limpiando oscillator:', error);
      }
    }
    if (this.filterNode) {
      this.filterNode.disconnect();
      this.filterNode = null;
    }
    if (this.gainNode) {
      this.gainNode.disconnect();
      this.gainNode = null;
    }
  }

  stop() {
    if (this.oscillator) {
      try {
        this.oscillator.stop();
      } catch (error) {
        console.error('Error deteniendo oscillator:', error);
      }
    }
    this.cleanup();
    document.removeEventListener('touchstart', this.initAudioContext);
  }
}

// Exportar una instancia única para toda la aplicación
export const beepPlayer = new BeepPlayer();
