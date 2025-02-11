import { playBeep } from "@/assets/beep";

export class SignalExtractor {
  private lastRedValues: number[] = [];

  private detectPeaks(signal: number[]) {
    return signal.filter((v, i, arr) => v > arr[i - 1] && v > arr[i + 1]).length;
  }

  extractChannels(imageData: ImageData) {
    let redSum = 0, pixelCount = 0;
    const { width, height } = imageData;
    const centerX = Math.floor(width / 2);
    const centerY = Math.floor(height / 2);
    const regionSize = 50;

    for (let y = centerY - regionSize; y < centerY + regionSize; y++) {
      for (let x = centerX - regionSize; x < centerX + regionSize; x++) {
        const i = (y * width + x) * 4;
        const red = imageData.data[i];

        if (red > 45) {
          redSum += red;
          pixelCount++;
        }
      }
    }

    if (pixelCount === 0) return { bpm: 0 };

    let avgRed = redSum / pixelCount;
    this.lastRedValues.push(avgRed);
    if (this.lastRedValues.length > 100) this.lastRedValues.shift();

    const peaks = this.detectPeaks([...this.lastRedValues]);
    const bpm = peaks * 6; // Escala a 60s

    if (peaks > 0) playBeep(); // 🔊 Sonido cada latido detectado

    return { bpm };
  }
}
