
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private lastBeepTime: number = 0;
  private readonly minBeepInterval = 300;
  private isInitialized = false;

  constructor() {
    // No inicializamos el contexto en el constructor
    // para evitar problemas con las políticas de autoplay
  }

  private async initAudioContext() {
    if (this.isInitialized) return;

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      // Intentar resumir el contexto inmediatamente
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      this.isInitialized = true;
      console.log('✓ Audio Context iniciado:', this.audioContext.state);
    } catch (error) {
      console.error('Error iniciando AudioContext:', error);
      throw error;
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat', quality: number = 1) {
    try {
      // Inicializar contexto si no existe
      if (!this.audioContext || !this.isInitialized) {
        await this.initAudioContext();
      }

      if (!this.audioContext) {
        console.error('No se pudo inicializar AudioContext');
        return;
      }

      // Verificar y resumir el contexto si está suspendido
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      const now = Date.now();
      if (now - this.lastBeepTime < this.minBeepInterval) {
        return;
      }

      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      // Configuración de frecuencia específica para latidos
      oscillator.frequency.value = type === 'heartbeat' ? 440 : 880;
      
      const currentTime = this.audioContext.currentTime;
      const volume = Math.min(0.8, Math.max(0.3, quality));

      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(volume, currentTime + 0.02);
      gainNode.gain.exponentialRampToValueAtTime(0.001, currentTime + 0.08);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.08);

      this.lastBeepTime = now;
      console.log('🔊 Beep reproducido:', {
        tiempo: now,
        tipo: type,
        calidad: quality,
        volumen: volume,
        estadoAudio: this.audioContext.state
      });

      // Limpiar después de que el sonido termine
      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
      }, 150);

    } catch (error) {
      console.error('Error reproduciendo beep:', error);
      // Re-inicializar el contexto si hay error
      this.isInitialized = false;
      this.audioContext = null;
      throw error;
    }
  }
}
