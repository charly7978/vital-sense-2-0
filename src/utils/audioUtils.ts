
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private isPlaying: boolean = false;
  private readonly heartbeatFrequency = 30;

  constructor() {
    console.log('🔊 BeepPlayer: Inicializando...');
    this.initAudioContext();
  }

  private async initAudioContext() {
    try {
      console.log('🔊 BeepPlayer: Creando contexto de audio...');
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.audioContext.resume();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0;
      console.log('✅ BeepPlayer: Contexto de audio inicializado correctamente');
    } catch (error) {
      console.error('❌ BeepPlayer: Error inicializando contexto de audio:', error);
    }
  }

  async playHeartbeat(quality: number = 1) {
    console.log('🫀 BeepPlayer: Intentando reproducir latido con calidad:', quality);
    
    if (this.isPlaying) {
      console.log('⏳ BeepPlayer: Ya hay un sonido reproduciéndose, esperando...');
      return;
    }

    if (!this.audioContext || !this.gainNode) {
      console.log('🔄 BeepPlayer: No hay contexto de audio, reinicializando...');
      await this.initAudioContext();
    }

    try {
      if (!this.audioContext || !this.gainNode) {
        console.error('❌ BeepPlayer: No se pudo inicializar el contexto de audio');
        return;
      }

      if (this.audioContext.state !== 'running') {
        console.log('▶️ BeepPlayer: Resumiendo contexto de audio...');
        await this.audioContext.resume();
      }

      this.isPlaying = true;
      console.log('🎵 BeepPlayer: Configurando oscilador para el latido...');

      if (this.oscillator) {
        this.oscillator.disconnect();
      }

      this.oscillator = this.audioContext.createOscillator();
      this.oscillator.frequency.value = this.heartbeatFrequency;
      this.oscillator.connect(this.gainNode);

      const now = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);

      // Primer sonido (lub) - más fuerte
      const lubVolume = 0.5 * quality;
      console.log('💓 BeepPlayer: Primer sonido (lub) con volumen:', lubVolume);
      this.gainNode.gain.linearRampToValueAtTime(lubVolume, now + 0.01);
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

      // Pausa breve
      this.gainNode.gain.linearRampToValueAtTime(0.001, now + 0.15);

      // Segundo sonido (dub) - más suave
      const dubVolume = 0.3 * quality;
      console.log('💓 BeepPlayer: Segundo sonido (dub) con volumen:', dubVolume);
      this.gainNode.gain.linearRampToValueAtTime(dubVolume, now + 0.16);
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

      this.oscillator.start(now);
      this.oscillator.stop(now + 0.3);

      console.log('✅ BeepPlayer: Latido reproducido exitosamente');

      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        this.isPlaying = false;
        console.log('🔄 BeepPlayer: Listo para el siguiente latido');
      }, 300);

    } catch (error) {
      console.error('❌ BeepPlayer: Error reproduciendo latido:', error);
      this.isPlaying = false;
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat', quality: number = 1) {
    console.log(`🔊 BeepPlayer: Reproduciendo sonido tipo '${type}' con calidad:`, quality);
    
    if (type === 'heartbeat') {
      return this.playHeartbeat(quality);
    }

    if (this.isPlaying) {
      console.log('⏳ BeepPlayer: Ya hay un sonido reproduciéndose');
      return;
    }

    try {
      if (!this.audioContext || !this.gainNode) {
        console.log('🔄 BeepPlayer: Reinicializando contexto de audio...');
        await this.initAudioContext();
      }

      if (!this.audioContext || !this.gainNode) {
        console.error('❌ BeepPlayer: No se pudo inicializar el contexto de audio');
        return;
      }

      if (this.audioContext.state !== 'running') {
        console.log('▶️ BeepPlayer: Resumiendo contexto de audio...');
        await this.audioContext.resume();
      }

      this.isPlaying = true;
      console.log('🎵 BeepPlayer: Configurando oscilador...');

      if (this.oscillator) {
        this.oscillator.disconnect();
      }

      this.oscillator = this.audioContext.createOscillator();
      
      switch (type) {
        case 'warning':
          this.oscillator.frequency.value = 440;
          console.log('⚠️ BeepPlayer: Configurado tono de advertencia');
          break;
        case 'success':
          this.oscillator.frequency.value = 880;
          console.log('✅ BeepPlayer: Configurado tono de éxito');
          break;
      }
      
      this.oscillator.connect(this.gainNode);

      const now = this.audioContext.currentTime;
      this.gainNode.gain.cancelScheduledValues(now);
      this.gainNode.gain.setValueAtTime(0, now);
      
      const volume = 0.3 * quality;
      console.log('🔊 BeepPlayer: Configurando volumen:', volume);
      this.gainNode.gain.linearRampToValueAtTime(volume, now + 0.01);
      this.gainNode.gain.linearRampToValueAtTime(0, type === 'warning' ? now + 0.3 : now + 0.15);

      this.oscillator.start(now);
      this.oscillator.stop(now + (type === 'warning' ? 0.3 : 0.15));

      console.log('✅ BeepPlayer: Sonido reproducido exitosamente');

      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        this.isPlaying = false;
        console.log('🔄 BeepPlayer: Listo para el siguiente sonido');
      }, type === 'warning' ? 300 : 150);

    } catch (error) {
      console.error('❌ BeepPlayer: Error reproduciendo beep:', error);
      this.isPlaying = false;
    }
  }
}
