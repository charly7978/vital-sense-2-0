
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    // Inicializar el contexto de audio inmediatamente
    try {
      console.log('Iniciando BeepPlayer...');
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      console.log('BeepPlayer inicializado:', {
        state: this.audioContext.state,
        sampleRate: this.audioContext.sampleRate
      });
    } catch (error) {
      console.error('Error al inicializar BeepPlayer:', error);
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat'): Promise<void> {
    if (this.isPlaying || !this.audioContext || !this.gainNode) {
      console.log('Skip: ya reproduciendo o no inicializado');
      return;
    }

    try {
      // Asegurar que el contexto esté activo
      if (this.audioContext.state === 'suspended') {
        console.log('Reactivando contexto de audio...');
        await this.audioContext.resume();
      }

      this.isPlaying = true;
      console.log('Comenzando reproducción de beep tipo:', type);

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const now = this.audioContext.currentTime;

      if (type === 'heartbeat') {
        // Sonido más simple y corto para latidos
        oscillator.frequency.value = 600; // Frecuencia más alta para ser más audible
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01); // Subida rápida
        gainNode.gain.linearRampToValueAtTime(0, now + 0.1); // Bajada gradual
        
        oscillator.start(now);
        oscillator.stop(now + 0.1);
      } else {
        // Beeps más largos para warning y success
        oscillator.frequency.value = type === 'warning' ? 880 : 1760;
        gainNode.gain.value = 0.2;
        oscillator.start();
        oscillator.stop(now + 0.2);
      }

      oscillator.onended = () => {
        console.log('Beep completado');
        oscillator.disconnect();
        gainNode.disconnect();
        this.isPlaying = false;
      };

    } catch (error) {
      console.error('Error reproduciendo beep:', error);
      this.isPlaying = false;
    }
  }
}
