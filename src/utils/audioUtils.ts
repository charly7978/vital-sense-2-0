
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
      console.log('Audio context initialized successfully');
    } catch (error) {
      console.error('Error al inicializar contexto de audio:', error);
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat') {
    if (!this.audioContext || !this.gainNode) {
      console.log('Initializing audio context before playing beep');
      await this.initAudioContext();
    }

    try {
      if (!this.audioContext || !this.gainNode) {
        console.error('Audio context still not available after initialization');
        return;
      }

      if (this.audioContext.state !== 'running') {
        console.log('Resuming audio context');
        await this.audioContext.resume();
      }

      if (this.oscillator) {
        this.oscillator.disconnect();
        this.oscillator = null;
      }

      this.oscillator = this.audioContext.createOscillator();
      
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
      
      if (type === 'heartbeat') {
        this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Aumentado de 0.1
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.1);
        console.log('Playing heartbeat sound');
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

