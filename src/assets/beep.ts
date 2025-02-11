export const playBeep = () => {
  const context = new AudioContext();
  const oscillator = context.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(1000, context.currentTime);
  oscillator.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.1);
};
