
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
      await this.audioContext.resume(); // Intentar activar inmediatamente
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0;
    } catch (error) {
      console.error('Error al inicializar contexto de audio:', error);
    }
  }

  async playBeep() {
    if (!this.audioContext || !this.gainNode) {
      await this.initAudioContext();
    }

    try {
      if (!this.audioContext || !this.gainNode) return;

      // Asegurar que el contexto esté activo
      if (this.audioContext.state !== 'running') {
        await this.audioContext.resume();
      }

      // Limpiar oscilador anterior si existe
      if (this.oscillator) {
        this.oscillator.disconnect();
        this.oscillator = null;
      }

      // Crear nuevo oscilador
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = 1000; // Frecuencia más alta para mejor audibilidad
      this.oscillator.connect(this.gainNode);

      // Configurar el beep
      const now = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(1.0, now + 0.005); // Ataque más rápido
      this.gainNode.gain.linearRampToValueAtTime(0, now + 0.05); // Duración más corta

      // Reproducir
      this.oscillator.start(now);
      this.oscillator.stop(now + 0.05);

      // Limpiar
      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.disconnect();
          this.oscillator = null;
        }
      }, 100);
    } catch (error) {
      console.error('Error al reproducir beep:', error);
    }
  }
}
