
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    try {
      // Forzar la inicialización inmediata
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error('Web Audio API no soportada');
      }
      
      this.audioContext = new AudioContextClass();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      
      // Intentar activar el contexto inmediatamente
      if (this.audioContext.state === 'suspended') {
        this.audioContext.resume().catch(console.error);
      }
      
      // Agregar listener para activar el contexto en interacción del usuario
      document.addEventListener('click', () => {
        if (this.audioContext?.state === 'suspended') {
          this.audioContext.resume().catch(console.error);
        }
      }, { once: true });
      
      console.log('BeepPlayer inicializado:', {
        contexto: 'creado',
        estado: this.audioContext.state,
        frecuenciaMuestreo: this.audioContext.sampleRate
      });
    } catch (error) {
      console.error('Error inicializando BeepPlayer:', error);
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat'): Promise<void> {
    if (!this.audioContext || !this.gainNode) {
      console.error('AudioContext no disponible');
      return;
    }

    if (this.isPlaying) {
      console.log('Ya reproduciendo, esperando...');
      return;
    }

    try {
      // Asegurar contexto activo
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      this.isPlaying = true;

      // Crear oscilador simple
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configurar sonido muy simple y directo
      oscillator.type = 'sine';
      oscillator.frequency.value = 800; // Frecuencia más alta y audible
      gainNode.gain.value = 0.5; // Volumen más alto

      const now = this.audioContext.currentTime;
      oscillator.start(now);
      oscillator.stop(now + 0.05); // Muy corto para evitar problemas

      console.log('Reproduciendo beep:', {
        tipo: type,
        frecuencia: oscillator.frequency.value,
        volumen: gainNode.gain.value,
        duracion: '0.05s'
      });

      // Limpiar recursos
      oscillator.onended = () => {
        oscillator.disconnect();
        gainNode.disconnect();
        this.isPlaying = false;
        console.log('Beep completado');
      };

    } catch (error) {
      console.error('Error reproduciendo beep:', error);
      this.isPlaying = false;
    }
  }
}
