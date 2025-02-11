
declare global {
  interface Window {
    cv: any;
  }
}

let isLoading = false;
let loadAttempts = 0;
const MAX_ATTEMPTS = 3;

export const loadOpenCV = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.cv) {
      console.log('OpenCV.js already loaded');
      resolve();
      return;
    }

    if (isLoading) {
      console.log('OpenCV.js is already loading');
      reject(new Error('OpenCV.js is already loading'));
      return;
    }

    if (loadAttempts >= MAX_ATTEMPTS) {
      reject(new Error('Máximo número de intentos de carga alcanzado'));
      return;
    }

    isLoading = true;
    loadAttempts++;

    const existingScripts = document.querySelectorAll('script[src*="opencv.js"]');
    existingScripts.forEach(script => {
      script.remove();
    });

    if (window.cv) {
      delete window.cv;
    }

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

    let timeoutId: number;

    script.addEventListener('load', () => {
      timeoutId = window.setTimeout(() => {
        if (window.cv) {
          console.log('OpenCV.js loaded successfully');
          cleanup();
          resolve();
        } else {
          cleanup();
          reject(new Error('OpenCV.js failed to initialize'));
        }
      }, 1000);
    });
    
    script.addEventListener('error', () => {
      cleanup();
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }
      reject(new Error('Failed to load OpenCV.js'));
    });

    document.body.appendChild(script);
  });
};

export const isOpenCVLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!window.cv;
};

