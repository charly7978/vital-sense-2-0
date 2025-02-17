export const getCameraConstraints = () => {
  return {
    video: {
      facingMode: 'environment', // Usar cámara trasera
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      brightness: { ideal: 100 }, // Aumentar brillo
      whiteBalanceMode: 'continuous',
      exposureMode: 'continuous',
      focusMode: 'continuous'
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