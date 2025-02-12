
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private isPlaying: boolean = false;
  private isInitialized: boolean = false;

  constructor() {
    // Intentamos inicializar inmediatamente
    console.log('BeepPlayer constructor called - attempting immediate initialization');
    this.initAudioContext().catch(err => {
      console.warn('Could not initialize audio context in constructor:', err);
    });
  }

  private async initAudioContext() {
    if (this.isInitialized) {
      console.log('Audio context already initialized');
      return;
    }

    try {
      console.log('Initializing audio context...');
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Intentar reanudar el contexto inmediatamente
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
        console.log('Audio context resumed from suspended state');
      }

      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0;
      
      this.isInitialized = true;
      console.log('Audio context initialized successfully', {
        state: this.audioContext.state,
        sampleRate: this.audioContext.sampleRate
      });
    } catch (error) {
      console.error('Error initializing audio context:', error);
      this.isInitialized = false;
      throw error;
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat') {
    console.log('playBeep called with type:', type);
    
    try {
      // Intentar inicializar si no está inicializado
      if (!this.isInitialized) {
        console.log('Audio not initialized, attempting initialization...');
        await this.initAudioContext();
      }

      if (!this.audioContext || !this.gainNode) {
        console.error('Audio context or gain node not available after initialization');
        return;
      }

      if (this.isPlaying) {
        console.log('Already playing a beep, skipping');
        return;
      }

      // Asegurarse que el contexto esté activo
      if (this.audioContext.state !== 'running') {
        console.log('Audio context not running, current state:', this.audioContext.state);
        await this.audioContext.resume();
        console.log('Audio context resumed, new state:', this.audioContext.state);
      }

      this.isPlaying = true;
      console.log('Starting beep playback...');

      // Limpiar oscilador anterior si existe
      if (this.oscillator) {
        this.oscillator.disconnect();
        this.oscillator = null;
      }

      this.oscillator = this.audioContext.createOscillator();
      
      // Aumentar la frecuencia para hacerlo más audible
      switch (type) {
        case 'heartbeat':
          this.oscillator.frequency.value = 150; // Aumentado de 40 a 150 Hz
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
        // Primer beat (lub) - más fuerte y corto
        this.gainNode.gain.linearRampToValueAtTime(0.8, now + 0.01); // Aumentado de 0.5 a 0.8
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
        
        // Pausa más corta
        this.gainNode.gain.linearRampToValueAtTime(0.001, now + 0.1);
        
        // Segundo beat (dub) - más fuerte
        this.gainNode.gain.linearRampToValueAtTime(0.6, now + 0.11); // Aumentado de 0.3 a 0.6
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
        
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.25);
        
        console.log('Playing heartbeat sound with enhanced volume');
      } else {
        this.gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
        this.gainNode.gain.linearRampToValueAtTime(0, type === 'warning' ? now + 0.3 : now + 0.15);
        this.oscillator.start(now);
        this.oscillator.stop(now + (type === 'warning' ? 0.3 : 0.15));
      }

      // Limpiar después de que termine el sonido
      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        this.isPlaying = false;
        console.log('Beep playback completed successfully');
      }, 300); // Reducido de 500 a 300ms

    } catch (error) {
      console.error('Error playing beep:', error);
      this.isPlaying = false;
      this.isInitialized = false; // Reset para reintentar inicialización
    }
  }
}
