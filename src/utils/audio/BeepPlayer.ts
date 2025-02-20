
export class BeepPlayer {
  async playBeep(type: string, volume: number = 1.0): Promise<void> {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = 'sine';
      oscillator.frequency.value = type === 'heartbeat' ? 440 : 880;
      gainNode.gain.value = volume;

      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      console.error('Error reproduciendo beep:', error);
    }
  }
}
