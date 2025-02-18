// ==================== BeepPlayer.ts ====================

export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;

  async playBeep(type: 'heartbeat' | 'alert' = 'heartbeat', volume: number = 0.1) {
    try {
      if (!this.audioContext) {
        this.audioContext = new AudioContext();
      }

      // Crear nodos de audio
      this.oscillator = this.audioContext.createOscillator();
      this.gainNode = this.audioContext.createGain();

      // Configurar tipo de beep
      if (type === 'heartbeat') {
        this.oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime); // La4
        this.gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
      } else {
        this.oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime); // La3
        this.gainNode.gain.setValueAtTime(volume * 0.5, this.audioContext.currentTime);
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
      }

      // Conectar nodos
      this.oscillator.connect(this.gainNode);
      this.gainNode.connect(this.audioContext.destination);

      // Reproducir y detener
      this.oscillator.start();
      this.oscillator.stop(this.audioContext.currentTime + (type === 'heartbeat' ? 0.1 : 0.2));

      // Limpiar después de reproducir
      this.oscillator.onended = () => {
        if (this.oscillator) {
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        if (this.gainNode) {
          this.gainNode.disconnect();
          this.gainNode = null;
        }
      };

    } catch (error) {
      console.error('Error reproduciendo beep:', error);
    }
  }

  stop() {
    try {
      if (this.oscillator) {
        this.oscillator.stop();
        this.oscillator.disconnect();
        this.oscillator = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
    } catch (error) {
      console.error('Error deteniendo beep:', error);
    }
  }
}