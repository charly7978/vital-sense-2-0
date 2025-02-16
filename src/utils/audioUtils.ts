
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private isPlaying: boolean = false;
  private readonly heartbeatFrequency = 30; // Frecuencia más baja para sonido más realista

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
      console.log('Contexto de audio inicializado correctamente');
    } catch (error) {
      console.error('Error inicializando contexto de audio:', error);
    }
  }

  async playHeartbeat(quality: number = 1) {
    if (this.isPlaying) {
      return;
    }

    if (!this.audioContext || !this.gainNode) {
      await this.initAudioContext();
    }

    try {
      if (!this.audioContext || !this.gainNode) {
        return;
      }

      if (this.audioContext.state !== 'running') {
        await this.audioContext.resume();
      }

      this.isPlaying = true;

      if (this.oscillator) {
        this.oscillator.disconnect();
      }

      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.frequency.value = this.heartbeatFrequency;
      this.oscillator.connect(this.gainNode);

      const now = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);

      // Primer sonido (lub) - más fuerte
      const lubVolume = 0.3 * quality;
      this.gainNode.gain.linearRampToValueAtTime(lubVolume, now + 0.01);
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      // Pausa breve
      this.gainNode.gain.linearRampToValueAtTime(0.001, now + 0.15);

      // Segundo sonido (dub) - más suave
      const dubVolume = 0.2 * quality;
      this.gainNode.gain.linearRampToValueAtTime(dubVolume, now + 0.16);
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      this.oscillator.start(now);
      this.oscillator.stop(now + 0.3);

      console.log('Reproduciendo sonido de latido con calidad:', quality);

      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        this.isPlaying = false;
      }, 300);

    } catch (error) {
      console.error('Error reproduciendo latido:', error);
      this.isPlaying = false;
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat', quality: number = 1) {
    if (type === 'heartbeat') {
      return this.playHeartbeat(quality);
    }

    if (this.isPlaying) {
      return;
    }

    try {
      if (!this.audioContext || !this.gainNode) {
        await this.initAudioContext();
      }

      if (!this.audioContext || !this.gainNode) {
        return;
      }

      if (this.audioContext.state !== 'running') {
        await this.audioContext.resume();
      }

      this.isPlaying = true;

      if (this.oscillator) {
        this.oscillator.disconnect();
      }

      this.oscillator = this.audioContext.createOscillator();
      
      switch (type) {
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
      
      const volume = 0.3 * quality;
      this.gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      this.gainNode.gain.linearRampToValueAtTime(0, type === 'warning' ? now + 0.3 : now + 0.15);

      this.oscillator.start(now);
      this.oscillator.stop(now + (type === 'warning' ? 0.3 : 0.15));

      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        this.isPlaying = false;
      }, type === 'warning' ? 300 : 150);

    } catch (error) {
      console.error('Error reproduciendo beep:', error);
      this.isPlaying = false;
    }
  }
}
