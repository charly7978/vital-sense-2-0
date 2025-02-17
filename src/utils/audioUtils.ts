
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private lastBeepTime: number = 0;
  private readonly minBeepInterval = 300; // Mínimo intervalo entre beeps en ms

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

      // Ajustar frecuencia y volumen según la calidad de la señal
      const baseFrequency = 150;
      oscillator.frequency.value = baseFrequency + (quality * 50);
      const volume = Math.min(0.5, Math.max(0.1, quality));

      // Configurar la envolvente del sonido
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.05);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.05);

      this.lastBeepTime = now;
      console.log('♥ Beep reproducido:', {
        tiempo: now,
        frecuencia: oscillator.frequency.value,
        volumen: volume,
        calidad: quality
      });

      // Limpiar después de que el sonido termine
      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
      }, 100);

    } catch (error) {
      console.error('✗ Error reproduciendo beep:', error);
    }
  }
}
