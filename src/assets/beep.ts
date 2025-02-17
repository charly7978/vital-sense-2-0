
// Funciones de utilidad para reproducir sonidos de beep
export const playBeep = (type: 'heartbeat' | 'warning' | 'success' = 'heartbeat') => {
  const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  // Configurar frecuencias para diferentes tipos de sonido
  switch (type) {
    case 'heartbeat':
      oscillator.frequency.value = 40; // Frecuencia más baja para sonido de latido
      break;
    case 'warning':
      oscillator.frequency.value = 440; // La4 (A4)
      break;
    case 'success':
      oscillator.frequency.value = 880; // La5 (A5)
      break;
  }

  const now = audioContext.currentTime;
  gainNode.gain.setValueAtTime(0, now);

  if (type === 'heartbeat') {
    // Primer beat (lub)
    gainNode.gain.linearRampToValueAtTime(0.5, now + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    
    // Pausa breve
    gainNode.gain.linearRampToValueAtTime(0.001, now + 0.15);
    
    // Segundo beat (dub)
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.16);
    gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
  } else {
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.01);
    gainNode.gain.linearRampToValueAtTime(0, type === 'warning' ? now + 0.3 : now + 0.15);
  }

  oscillator.start(now);
  oscillator.stop(now + (type === 'heartbeat' ? 0.3 : type === 'warning' ? 0.3 : 0.15));

  // Limpiar después de que el sonido termine
  setTimeout(() => {
    oscillator.disconnect();
    gainNode.disconnect();
  }, 500);
};

