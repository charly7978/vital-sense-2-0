
declare global {
  interface Window {
    cv: any;
  }
}

export const loadOpenCV = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.cv) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.setAttribute('async', '');
    script.setAttribute('type', 'text/javascript');
    script.setAttribute('src', 'https://docs.opencv.org/4.8.0/opencv.js');
    
    script.addEventListener('load', () => {
      console.log('OpenCV.js loaded successfully');
      resolve();
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
