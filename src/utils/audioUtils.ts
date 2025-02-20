
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private lastBeepTime: number = 0;
  private readonly minBeepInterval = 200;

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

  async playHeartbeatSound(volumeMultiplier: number = 1) {
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
      const currentTime = this.audioContext.currentTime;

      // Crear osciladores para los dos sonidos del latido
      const oscillator1 = this.audioContext.createOscillator();
      const oscillator2 = this.audioContext.createOscillator();
      const gainNode1 = this.audioContext.createGain();
      const gainNode2 = this.audioContext.createGain();

      // Conectar los nodos
      oscillator1.connect(gainNode1);
      oscillator2.connect(gainNode2);
      gainNode1.connect(this.audioContext.destination);
      gainNode2.connect(this.audioContext.destination);

      // Configurar frecuencias más bajas para un sonido más realista
      oscillator1.frequency.setValueAtTime(65, currentTime); // Frecuencia más baja para "lub"
      oscillator2.frequency.setValueAtTime(45, currentTime); // Frecuencia aún más baja para "dub"

      // Volumen base aumentado significativamente
      const baseVolume = Math.min(0.75 * volumeMultiplier, 1.0);

      // Primer sonido (lub) más fuerte
      gainNode1.gain.setValueAtTime(0, currentTime);
      gainNode1.gain.linearRampToValueAtTime(baseVolume, currentTime + 0.01);
      gainNode1.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.1);

      // Segundo sonido (dub) proporcionalmente más fuerte
      gainNode2.gain.setValueAtTime(0, currentTime + 0.05);
      gainNode2.gain.linearRampToValueAtTime(baseVolume * 0.85, currentTime + 0.06);
      gainNode2.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.15);

      // Iniciar y detener los osciladores
      oscillator1.start(currentTime);
      oscillator2.start(currentTime);
      oscillator1.stop(currentTime + 0.2);
      oscillator2.stop(currentTime + 0.2);

      this.lastBeepTime = now;
      console.log('♥ Latido reproducido:', {
        tiempo: now,
        volumen: baseVolume
      });

      // Limpiar los nodos después de reproducir
      setTimeout(() => {
        oscillator1.disconnect();
        oscillator2.disconnect();
        gainNode1.disconnect();
        gainNode2.disconnect();
      }, 300);

    } catch (error) {
      console.error('✗ Error reproduciendo latido:', error);
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat', volumeMultiplier: number = 1) {
    if (type === 'heartbeat') {
      return this.playHeartbeatSound(volumeMultiplier);
    }

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

      // Frecuencia base más alta para un beep más audible
      oscillator.frequency.value = 880; // Nota A5
      
      // Volumen base mucho más alto
      const baseVolume = 0.75;
      const finalVolume = Math.min(baseVolume * volumeMultiplier, 1.0);

      // Envolvente de amplitud más pronunciada
      gainNode.gain.setValueAtTime(0, currentTime);
      gainNode.gain.linearRampToValueAtTime(finalVolume, currentTime + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, currentTime + 0.05);

      oscillator.start(currentTime);
      oscillator.stop(currentTime + 0.05);

      this.lastBeepTime = now;
      console.log('♥ Beep reproducido:', {
        tiempo: now,
        frecuencia: oscillator.frequency.value,
        volumen: finalVolume
      });

      setTimeout(() => {
        oscillator.disconnect();
        gainNode.disconnect();
      }, 100);

    } catch (error) {
      console.error('✗ Error reproduciendo beep:', error);
    }
  }
}
