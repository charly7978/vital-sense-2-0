export const getCameraConstraints = () => {
  const isAndroid = /Android/i.test(navigator.userAgent);
  
  return {
    video: {
      facingMode: 'environment',
      width: { ideal: isAndroid ? 1280 : 1920 },
      height: { ideal: isAndroid ? 720 : 1080 },
      frameRate: { ideal: 30, max: 30 },
      aspectRatio: 4/3,
    },
    audio: false
  };
};

export const setupFlashlight = async (stream: MediaStream) => {
  try {
    const track = stream.getVideoTracks()[0];
    const capabilities = track.getCapabilities();
    
    if (capabilities.torch) {
      await track.applyConstraints({
        advanced: [{ torch: true }]
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error al activar la linterna:', error);
    return false;
  }
};

// Optimización de configuración para diferentes dispositivos Android
export const optimizeForDevice = async (track: MediaStreamTrack) => {
  const settings: MediaTrackConstraints = {
    advanced: [{
      // Usar solo propiedades estándar soportadas
      exposureMode: 'manual',
      whiteBalance: 'manual'
    }]
  };

  try {
    await track.applyConstraints(settings);
    return true;
  } catch (error) {
    console.warn('No se pudieron aplicar todas las optimizaciones:', error);
    return false;
  }
};