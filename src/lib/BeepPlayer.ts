export class BeepPlayer {
    private audioContext: AudioContext | null = null;
    private oscillator: OscillatorNode | null = null;

    public play(frequency: number = 440, duration: number = 100): void {
        this.stop();  // Detener cualquier sonido anterior
        this.audioContext = new AudioContext();
        this.oscillator = this.audioContext.createOscillator();
        this.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        this.oscillator.connect(this.audioContext.destination);
        this.oscillator.start();
        setTimeout(() => this.stop(), duration);
    }

    public stop(): void {
        if (this.oscillator) {
            this.oscillator.stop();
            this.oscillator.disconnect();
            this.oscillator = null;
        }
        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }
    }

    public dispose(): void {
        this.stop();
    }
}
