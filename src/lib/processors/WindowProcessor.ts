
import { Float64Type } from '@/types/common';

export class WindowProcessor {
  public applyWindow(signal: Float64Type, windowType: string): Float64Type {
    const N = signal.length;
    const windowed = new Float64Array(N);
    
    switch (windowType.toLowerCase()) {
      case 'hanning':
        for (let i = 0; i < N; i++) {
          const window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
          windowed[i] = signal[i] * window;
        }
        break;
        
      case 'hamming':
        for (let i = 0; i < N; i++) {
          const window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
          windowed[i] = signal[i] * window;
        }
        break;
        
      case 'blackman':
        for (let i = 0; i < N; i++) {
          const window = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)) + 
                        0.08 * Math.cos((4 * Math.PI * i) / (N - 1));
          windowed[i] = signal[i] * window;
        }
        break;
        
      case 'rectangular':
      default:
        return new Float64Array(signal);
    }
    
    return windowed;
  }

  public dispose(): void {
    // No resources to clean up
  }
}
