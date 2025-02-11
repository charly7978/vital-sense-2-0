
export class BeepPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private isPlaying: boolean = false;

  constructor() {
    this.initAudioContext();
  }

  private async initAudioContext() {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      await this.audioContext.resume();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = 0;
      console.log('Audio context initialized successfully');
    } catch (error) {
      console.warn('Error initializing audio context:', error);
    }
  }

  async playBeep(type: 'heartbeat' | 'warning' | 'success' = 'heartbeat') {
    if (this.isPlaying) {
      console.log('Already playing a beep, skipping');
      return;
    }

    if (!this.audioContext || !this.gainNode) {
      console.log('Initializing audio context before playing beep');
      await this.initAudioContext();
    }

    try {
      if (!this.audioContext || !this.gainNode) {
        console.warn('Audio context still not available after initialization');
        return;
      }

      // Ensure audioContext is running
      if (this.audioContext.state !== 'running') {
        console.log('Resuming audio context');
        await this.audioContext.resume();
      }

      this.isPlaying = true;

      // Cleanup previous oscillator
      if (this.oscillator) {
        this.oscillator.disconnect();
        this.oscillator = null;
      }

      this.oscillator = this.audioContext.createOscillator();
      
      // Configure frequencies for different sound types
      switch (type) {
        case 'heartbeat':
          // Lower frequency for more realistic heartbeat sound
          this.oscillator.frequency.value = 40;
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
        // Create a more realistic "lub-dub" heartbeat sound
        // First beat (lub)
        this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        
        // Short pause
        this.gainNode.gain.linearRampToValueAtTime(0.001, now + 0.15);
        
        // Second beat (dub)
        this.gainNode.gain.linearRampToValueAtTime(0.2, now + 0.16);
        this.gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.3);
        
        console.log('Playing heartbeat sound');
      } else if (type === 'warning') {
        this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.3);
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.3);
      } else {
        this.gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
        this.gainNode.gain.linearRampToValueAtTime(0, now + 0.15);
        this.oscillator.start(now);
        this.oscillator.stop(now + 0.15);
      }

      // Cleanup oscillator after sound is complete
      setTimeout(() => {
        if (this.oscillator) {
          this.oscillator.disconnect();
          this.oscillator = null;
        }
        this.isPlaying = false;
      }, 500);
    } catch (error) {
      console.warn('Error playing beep:', error);
      this.isPlaying = false;
    }
  }
}
