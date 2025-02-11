
declare global {
  interface Window {
    cv: any;
  }
}

let isLoading = false;

export const loadOpenCV = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If OpenCV is already loaded and initialized, resolve immediately
    if (window.cv) {
      console.log('OpenCV.js already loaded');
      resolve();
      return;
    }

    // Prevent concurrent loads
    if (isLoading) {
      console.log('OpenCV.js is already loading');
      reject(new Error('OpenCV.js is already loading'));
      return;
    }

    isLoading = true;

    // Remove any existing OpenCV script elements
    const existingScripts = document.querySelectorAll('script[src*="opencv.js"]');
    existingScripts.forEach(script => {
      script.remove();
    });

    // Clear any existing cv object and WASM module
    if (window.cv) {
      delete window.cv;
    }

    // Clear any Module object that might exist from a previous load
    if ('Module' in window) {
      delete (window as any).Module;
    }

    const script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', 'https://docs.opencv.org/4.8.0/opencv.js');
    
    const cleanup = () => {
      isLoading = false;
    };

    script.addEventListener('load', () => {
      // Wait a short moment for WASM initialization
      setTimeout(() => {
        if (window.cv) {
          console.log('OpenCV.js loaded successfully');
          cleanup();
          resolve();
        } else {
          cleanup();
          reject(new Error('OpenCV.js failed to initialize'));
        }
      }, 100);
    });
    
    script.addEventListener('error', () => {
      cleanup();
      reject(new Error('Failed to load OpenCV.js'));
    });

    document.body.appendChild(script);
  });
};

export const isOpenCVLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!window.cv;
};
