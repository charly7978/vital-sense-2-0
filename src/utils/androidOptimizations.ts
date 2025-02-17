export const androidOptimizations = {
  // Detectar si es un dispositivo Android
  isAndroid: () => /Android/i.test(navigator.userAgent),
  
  // Optimizar el uso de recursos
  optimizePerformance: () => {
    if (typeof window !== 'undefined') {
      // Reducir la calidad de las animaciones en dispositivos de gama baja
      if ('requestAnimationFrame' in window) {
        const originalRAF = window.requestAnimationFrame;
        window.requestAnimationFrame = (callback) => {
          return originalRAF(() => {
            try {
              callback(performance.now());
            } catch (e) {
              console.warn('Error en animación:', e);
            }
          });
        };
      }
    }
  },

  // Optimizar el manejo de memoria
  optimizeMemory: () => {
    let lastClearTime = Date.now();
    
    return {
      clearUnusedMemory: () => {
        const now = Date.now();
        if (now - lastClearTime > 30000) { // Cada 30 segundos
          if (global.gc) {
            try {
              global.gc();
            } catch (e) {
              console.warn('No se pudo liberar memoria');
            }
          }
          lastClearTime = now;
        }
      }
    };
  },

  // Optimizar el procesamiento de frames
  optimizeFrameProcessing: (frame: ImageData) => {
    // Reducir la resolución de procesamiento para dispositivos de gama baja
    const scaleFactor = 0.5;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return frame;

    canvas.width = frame.width * scaleFactor;
    canvas.height = frame.height * scaleFactor;
    
    const imageData = new ImageData(
      new Uint8ClampedArray(frame.data),
      frame.width,
      frame.height
    );
    
    ctx.putImageData(imageData, 0, 0);
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
}; 