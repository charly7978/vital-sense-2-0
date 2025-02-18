// ==================== audioUtils.ts ====================

export class BeepPlayer {
  // OPTIMIZACIÓN: Configuración mejorada para sonido médico
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private lastBeepTime: number = 0;
  private readonly minBeepInterval = 300;

  constructor() {
    // OPTIMIZACIÓN: Inicialización bajo demanda para móviles
    this.initAudioContext = this.initAudioContext.bind(this);
    document.addEventListener('touchstart', this.initAudioContext, { once: true });
  }

  private initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  // OPTIMIZACIÓN: Beep mejorado tipo monitor cardíaco
  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat', volumeMultiplier: number = 1) {
    const now = Date.now();
    if (now - this.lastBeepTime < this.minBeepInterval) {
      return;
    }

    try {
      this.initAudioContext();
      if (!this.audioContext) return;

      // OPTIMIZACIÓN: Crear nodos de audio
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();
      this.filterNode = this.audioContext.createBiquadFilter();

      // OPTIMIZACIÓN: Configurar filtro para sonido médico
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.value = 1200;  // Frecuencia más alta
      this.filterNode.Q.value = 15;           // Resonancia aumentada

      // OPTIMIZACIÓN: Configurar oscilador para sonido más claro
      this.oscillator.type = 'sine';
      const now = this.audioContext.currentTime;
      
      // OPTIMIZACIÓN: Sweep de frecuencia más pronunciado
      this.oscillator.frequency.setValueAtTime(880, now);
      this.oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.04);

      // OPTIMIZACIÓN: Envelope más definido y volumen aumentado
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(0.7 * volumeMultiplier, now + 0.01);
      this.gainNode.gain.linearRampToValueAtTime(0.3 * volumeMultiplier, now + 0.03);
      this.gainNode.gain.linearRampToValueAtTime(0, now + 0.06);

      // OPTIMIZACIÓN: Conectar nodos con el filtro
      this.oscillator.connect(this.filterNode);
      this.filterNode.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // OPTIMIZACIÓN: Reproducir con duración aumentada
      this.oscillator.start(now);
      this.oscillator.stop(now + 0.06);

      this.lastBeepTime = Date.now();

      // OPTIMIZACIÓN: Logging para debugging
      console.log('🔊 Beep reproducido:', {
        tipo: type,
        volumen: volumeMultiplier,
        tiempo: now
      });

      // OPTIMIZACIÓN: Limpiar después de reproducir
      setTimeout(() => this.cleanup(), 100);

    } catch (error) {
      console.error('Error reproduciendo beep:', error);
      this.cleanup();
    }
  }

  // OPTIMIZACIÓN: Limpieza mejorada
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

  // OPTIMIZACIÓN: Stop mejorado
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

// OPTIMIZACIÓN: Exportar instancia única
export const beepPlayer = new BeepPlayer();
