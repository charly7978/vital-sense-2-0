
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;

  constructor() {
    this.initAudioContext();
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.audioContext.resume();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0;
    } catch (error) {
      console.error('Error al inicializar contexto de audio:', error);
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat') {
    if (!this.audioContext || !this.gainNode) {
      await this.initAudioContext();
    }

    try {
      if (!this.audioContext || !this.gainNode) return;

      if (this.audioContext.state !== 'running') {
        await this.audioContext.resume();
      }

      if (this.oscillator) {
        this.oscillator.disconnect();
        this.oscillator = null;
      }

      this.oscillator = this.audioContext.createOscillator();
      
      // Sonido más suave y realista para el latido
      switch (type) {
        case 'heartbeat':
          this.oscillator.frequency.value = 60;
          break;
        case 'warning':
          this.oscillator.frequency.value = 440;
          break;
        case 'success':
          this.oscillator.frequency.value = 880;
          break;
      }
      
      this.oscillator.connect(this.gainNode);

      const now = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);
      
      // Para el latido, hacer un sonido más suave y corto
      if (type === 'heartbeat') {
        this.gainNode.gain.linearRampToValueAtTime(0.1, now + 0.01);
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.1);
      } else if (type === 'warning') {
        this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.3);
      } else {
        this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.15);
      }

      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.disconnect();
          this.oscillator = null;
        }
      }, 500);
    } catch (error) {
      console.error('Error al reproducir beep:', error);
    }
  }
}
