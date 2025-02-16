
export class BeepPlayer {
  private audioContext: AudioContext | null = null;

  constructor() {
    this.initAudioContext();
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.audioContext.resume();
    } catch (error) {
      console.error('Error inicializando audio:', error);
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat', quality: number = 1) {
    if (!this.audioContext) {
      await this.initAudioContext();
    }

    if (!this.audioContext) {
      console.error('No se pudo inicializar el audio');
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configurar el tipo de sonido
      if (type === 'heartbeat') {
        oscillator.frequency.value = 40;
        const now = this.audioContext.currentTime;
        
        // Primer sonido (lub)
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.6, now + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      } else {
        oscillator.frequency.value = type === 'warning' ? 440 : 880;
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(0.3, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      }

    } catch (error) {
      console.error('Error reproduciendo beep:', error);
    }
  }
}
