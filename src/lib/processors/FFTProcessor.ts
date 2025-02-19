
import { Float64Type } from '@/types/common';
import fft from 'fft.js';

export class FFTProcessor {
  private fft: any;
  
  constructor() {
    this.fft = new fft(1024);
  }

  public transform(signal: Float64Type, nfft: number): Float64Type {
    // Initialize FFT with correct size if needed
    if (this.fft.size !== nfft) {
      this.fft = new fft(nfft);
    }

    // Pad signal if needed
    const padded = new Float64Array(nfft);
    padded.set(signal);

    // Run FFT
    const result = this.fft.createComplexArray();
    this.fft.transform(result, padded);

    return result;
  }

  public dispose(): void {
    this.fft = null;
  }
}
