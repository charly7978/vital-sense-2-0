
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;

  constructor() {
    // Inicializar el contexto de audio solo cuando se necesite
    // para evitar el error de "The AudioContext was not allowed to start"
    this.initAudioContext();
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0;

      // Asegurarse de que el contexto esté en estado "running"
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
    } catch (error) {
      console.error('Error initializing audio context:', error);
    }
  }

  async playBeep() {
    if (!this.audioContext || !this.gainNode) {
      await this.initAudioContext();
    }

    try {
      if (!this.audioContext || !this.gainNode) return;

      // Asegurarse de que el contexto esté activo
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Crear y configurar el oscilador
      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.type = 'sine';
      this.oscillator.frequency.value = 880; // Nota A5
      this.oscillator.connect(this.gainNode);

      // Programar el beep
      const now = this.audioContext.currentTime;
      this.gainNode.gain.setValueAtTime(0, now);
      this.gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01); // Volumen más alto
      this.gainNode.gain.linearRampToValueAtTime(0, now + 0.1);

      // Iniciar y detener el oscilador
      this.oscillator.start(now);
      this.oscillator.stop(now + 0.1);

      // Limpiar el oscilador después de que termine
      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.disconnect();
          this.oscillator = null;
        }
      }, 200);
    } catch (error) {
      console.error('Error playing beep:', error);
    }
  }
}
