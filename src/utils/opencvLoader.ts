
declare global {
  interface Window {
    cv: any;
  }
}

export const loadOpenCV = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // If OpenCV is already loaded, resolve immediately
    if (window.cv) {
      console.log('OpenCV.js already loaded');
      resolve();
      return;
    }

    // Remove any existing OpenCV script elements
    const existingScripts = document.querySelectorAll('script[src*="opencv.js"]');
    existingScripts.forEach(script => {
      script.remove();
    });

    // Clear any existing cv object to prevent double registration
    if (window.cv) {
      delete window.cv;
    }

    const script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', 'https://docs.opencv.org/4.8.0/opencv.js');
    
    script.addEventListener('load', () => {
      if (window.cv) {
        console.log('OpenCV.js loaded successfully');
        resolve();
      } else {
        reject(new Error('OpenCV.js failed to initialize'));
      }
    });
    
    script.addEventListener('error', () => {
      reject(new Error('Failed to load OpenCV.js'));
    });

    document.body.appendChild(script);
  });
};

export const isOpenCVLoaded = (): boolean => {
  return typeof window !== 'undefined' && !!window.cv;
};
