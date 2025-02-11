
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
      
      // Diferentes sonidos según el tipo
      switch (type) {
        case 'heartbeat':
          this.oscillator.frequency.value = 1000;
          break;
        case 'warning':
          this.oscillator.frequency.value = 440;
          break;
        case 'success':
          this.oscillator.frequency.value = 1500;
          break;
      }
      
      this.oscillator.connect(this.gainNode);

      const now = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);
      
      // Diferentes duraciones según el tipo
      if (type === 'warning') {
        this.gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.3);
      } else if (type === 'success') {
        this.gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.15);
      } else {
        this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.005);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.05);
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.05);
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

