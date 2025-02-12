
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    // No inicializamos aquí, esperamos a la primera interacción
    console.log('BeepPlayer constructor called');
  }

  private async createAudioContext() {
    if (this.audioContext) {
      return;
    }

    try {
      console.log('Creating new AudioContext...');
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (this.audioContext.state === 'suspended') {
        console.log('Resuming suspended audio context...');
        await this.audioContext.resume();
      }

      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      console.log('AudioContext created successfully:', {
        state: this.audioContext.state,
        sampleRate: this.audioContext.sampleRate
      });
    } catch (error) {
      console.error('Error creating AudioContext:', error);
      throw error;
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat'): Promise<void> {
    if (this.isPlaying) {
      console.log('Already playing, skipping');
      return;
    }

    try {
      // Crear contexto si no existe
      if (!this.audioContext) {
        await this.createAudioContext();
      }

      if (!this.audioContext || !this.gainNode) {
        throw new Error('Audio initialization failed');
      }

      // Asegurar que el contexto esté activo
      if (this.audioContext.state !== 'running') {
        console.log('Resuming audio context...');
        await this.audioContext.resume();
      }

      this.isPlaying = true;

      // Crear nuevo oscilador para cada beep
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configurar el tipo de sonido
      if (type === 'heartbeat') {
        oscillator.frequency.value = 440; // Frecuencia más audible
        gainNode.gain.value = 0;
        
        const now = this.audioContext.currentTime;
        
        // Primer pulso (más fuerte)
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(1.0, now + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        // Segundo pulso (más suave)
        gainNode.gain.setValueAtTime(0.7, now + 0.1);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
        
        oscillator.start(now);
        oscillator.stop(now + 0.2);
      } else {
        // Otros tipos de beep
        oscillator.frequency.value = type === 'warning' ? 880 : 1760;
        gainNode.gain.value = 0.5;
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.15);
      }

      // Limpiar después de reproducir
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
        this.isPlaying = false;
        console.log('Beep completed');
      };

    } catch (error) {
      console.error('Error playing beep:', error);
      this.isPlaying = false;
      throw error;
    }
  }
}
