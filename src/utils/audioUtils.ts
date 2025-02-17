
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private lastBeepTime: number = 0;
  private readonly minBeepInterval = 200; // Reducido para mejor respuesta

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
      const filterNode = this.audioContext.createBiquadFilter();

      // Configuración del filtro para un sonido más limpio
      filterNode.type = 'lowpass';
      filterNode.frequency.value = 800;
      filterNode.Q.value = 1;

      // Conexión de nodos con el filtro
      oscillator.connect(filterNode);
      filterNode.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      const currentTime = this.audioContext.currentTime;

      if (type === 'heartbeat') {
        // Aumentada la frecuencia y volumen para mejor audibilidad
        oscillator.frequency.value = 600; // Frecuencia más alta y clara
        
        // Primer pulso (más fuerte)
        gainNode.gain.setValueAtTime(0, currentTime);
        gainNode.gain.linearRampToValueAtTime(3.0, currentTime + 0.01); // Volumen aumentado significativamente
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);
        
        // Segundo pulso (más suave pero aún audible)
        gainNode.gain.linearRampToValueAtTime(0.001, currentTime + 0.1);
        gainNode.gain.linearRampToValueAtTime(2.0, currentTime + 0.11);
        gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.18);
        
        oscillator.start(currentTime);
        oscillator.stop(currentTime + 0.2);

        console.log('♥ Beep de latido reproducido');
        this.lastBeepTime = now;
      }

      // Limpieza después de la reproducción
      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
        filterNode.disconnect();
      }, 300);

    } catch (error) {
      console.error('✗ Error reproduciendo beep:', error);
    }
  }
}
