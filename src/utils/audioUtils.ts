
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private lastBeepTime: number = 0;
  private readonly minBeepInterval = 300;

  constructor() {
    this.initAudioContext();
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.audioContext.resume();
      console.log('✓ Audio Context inicializado correctamente');
    } catch (error) {
      console.error('✗ Error inicializando audio:', error);
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat', volumeMultiplier: number = 1) {
    const now = Date.now();
    if (now - this.lastBeepTime < this.minBeepInterval) {
      console.log('⚠ Beep ignorado: demasiado pronto');
      return;
    }

    if (!this.audioContext) {
      await this.initAudioContext();
    }

    if (!this.audioContext) {
      console.error('✗ No se pudo inicializar el audio');
      return;
    }

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;

      // Frecuencia base más alta para un beep más audible
      oscillator.frequency.value = 880; // Nota A5
      
      // Volumen base mucho más alto
      const baseVolume = 0.75;
      const finalVolume = Math.min(baseVolume * volumeMultiplier, 1.0);

      // Envolvente de amplitud más pronunciada
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(finalVolume, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.05);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.05);

      this.lastBeepTime = now;
      console.log('♥ Beep reproducido:', {
        tiempo: now,
        frecuencia: oscillator.frequency.value,
        volumen: finalVolume
      });

      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
      }, 100);

    } catch (error) {
      console.error('✗ Error reproduciendo beep:', error);
    }
  }
}
