
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

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat', quality: number = 1) {
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

      if (type === 'heartbeat') {
        // Frecuencia aumentada para mejor audibilidad
        oscillator.frequency.value = 200;
        
        // Primer pulso (más fuerte)
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(0.9, currentTime + 0.01); // Volumen aumentado
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.08);

        console.log('♥ Beep de latido reproducido');
        this.lastBeepTime = now;
      }

    } catch (error) {
      console.error('✗ Error reproduciendo beep:', error);
    }
  }
}
