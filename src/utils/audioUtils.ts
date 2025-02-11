
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;

  constructor() {
    this.audioContext = new AudioContext();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
    this.gainNode.gain.value = 0;
  }

  playBeep() {
    if (!this.audioContext || !this.gainNode) return;

    // Create and configure oscillator
    this.oscillator = this.audioContext.createOscillator();
    this.oscillator.type = 'sine';
    this.oscillator.frequency.value = 880; // A5 note
    this.oscillator.connect(this.gainNode);

    // Schedule the beep
    const now = this.audioContext.currentTime;
    this.gainNode.gain.setValueAtTime(0, now);
    this.gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
    this.gainNode.gain.linearRampToValueAtTime(0, now + 0.1);

    // Start and stop the oscillator
    this.oscillator.start(now);
    this.oscillator.stop(now + 0.1);
  }
}
