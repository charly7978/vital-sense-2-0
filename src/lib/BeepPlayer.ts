
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private lastBeepTime: number = 0;
  private readonly minBeepInterval = 300; // ms

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat', volumeMultiplier: number = 1) {
    const now = Date.now();
    if (now - this.lastBeepTime < this.minBeepInterval) {
      return;
    }

    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configuración según el tipo de beep
      switch (type) {
        case 'heartbeat':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.1 * volumeMultiplier, this.audioContext.currentTime);
          break;
        case 'warning':
          oscillator.type = 'square';
          oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.2 * volumeMultiplier, this.audioContext.currentTime);
          break;
        case 'success':
          oscillator.type = 'sine';
          oscillator.frequency.setValueAtTime(660, this.audioContext.currentTime);
          gainNode.gain.setValueAtTime(0.15 * volumeMultiplier, this.audioContext.currentTime);
          break;
      }

      // Fade out
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        this.audioContext.currentTime + 0.1
      );

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.1);

      this.lastBeepTime = now;

    } catch (error) {
      console.error('Error reproduciendo beep:', error);
    }
  }

  stop() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
