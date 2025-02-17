export const signalOptimizations = {
  android: {
    // Optimizaciones para Android
    filterSignal: (signal: number[]): number[] => {
      const alpha = 0.2;  // Filtro paso bajo
      const filtered = signal.map((value, index) => {
        if (index === 0) return value;
        return alpha * value + (1 - alpha) * signal[index - 1];
      });
      
      // Eliminar tendencia
      const trend = filtered.map((_, i) => 
        i / filtered.length * (filtered[filtered.length - 1] - filtered[0]) + filtered[0]
      );
      
      return filtered.map((value, i) => value - trend[i]);
    },

    detectPeaks: (signal: number[]): number[] => {
      const peaks: number[] = [];
      const windowSize = 5;
      const threshold = 0.6;
      
      for (let i = windowSize; i < signal.length - windowSize; i++) {
        const window = signal.slice(i - windowSize, i + windowSize + 1);
        const max = Math.max(...window);
        if (signal[i] === max && signal[i] > threshold) {
          peaks.push(i);
        }
      }
      
      return peaks;
    }
  },

  webcam: {
    // Optimizaciones para webcam
    filterSignal: (signal: number[]): number[] => {
      const alpha = 0.3;  // Filtro más suave para webcam
      return signal.map((value, index) => {
        if (index === 0) return value;
        return alpha * value + (1 - alpha) * signal[index - 1];
      });
    },

    detectPeaks: (signal: number[]): number[] => {
      const peaks: number[] = [];
      const windowSize = 3;  // Ventana más pequeña para webcam
      const threshold = 0.5; // Umbral más bajo
      
      for (let i = windowSize; i < signal.length - windowSize; i++) {
        const window = signal.slice(i - windowSize, i + windowSize + 1);
        const max = Math.max(...window);
        if (signal[i] === max && signal[i] > threshold) {
          peaks.push(i);
        }
      }
      
      return peaks;
    }
  }
}; 