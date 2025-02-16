
interface PTTResult {
  ptt: number;
  confidence: number;
  features: {
    systolicPeak: number;
    diastolicPeak: number;
    notchTime: number;
    pulseWidth: number;
  };
}

export class PTTProcessor {
  private lastValidPTT: number = 0;
  private readonly minValidPTT = 150; // ms
  private readonly maxValidPTT = 400; // ms

  calculatePTT(ppgSignal: number[]): PTTResult | null {
    if (!ppgSignal || ppgSignal.length < 3) return null;

    try {
      // Find systolic peak (maximum point in the signal)
      const systolicPeak = Math.max(...ppgSignal);
      const systolicIndex = ppgSignal.indexOf(systolicPeak);

      if (systolicIndex === -1) return null;

      // Find dicrotic notch (local minimum after systolic peak)
      let notchIndex = -1;
      let notchValue = systolicPeak;
      
      for (let i = systolicIndex + 1; i < ppgSignal.length - 1; i++) {
        if (ppgSignal[i] < ppgSignal[i+1] && ppgSignal[i] < ppgSignal[i-1]) {
          notchIndex = i;
          notchValue = ppgSignal[i];
          break;
        }
      }

      if (notchIndex === -1) return null;

      // Find diastolic peak (local maximum after dicrotic notch)
      let diastolicIndex = -1;
      let diastolicPeak = notchValue;

      for (let i = notchIndex + 1; i < ppgSignal.length - 1; i++) {
        if (ppgSignal[i] > diastolicPeak) {
          diastolicIndex = i;
          diastolicPeak = ppgSignal[i];
        }
      }

      // Calculate PTT as time between systolic peak and dicrotic notch
      const ptt = (notchIndex - systolicIndex) * (1000 / 30); // Assuming 30Hz sampling rate

      // Validate PTT
      if (ptt < this.minValidPTT || ptt > this.maxValidPTT) {
        return null;
      }

      // Calculate pulse width and other features
      const pulseWidth = (diastolicIndex - systolicIndex) * (1000 / 30);

      // Calculate confidence based on signal quality and feature reliability
      const amplitudeRatio = diastolicPeak / systolicPeak;
      const notchPromience = (systolicPeak - notchValue) / systolicPeak;
      const confidence = this.calculateConfidence(amplitudeRatio, notchPromience);

      this.lastValidPTT = ptt;

      return {
        ptt,
        confidence,
        features: {
          systolicPeak,
          diastolicPeak,
          notchTime: notchIndex * (1000 / 30),
          pulseWidth
        }
      };
    } catch (error) {
      console.error('Error calculating PTT:', error);
      return null;
    }
  }

  private calculateConfidence(amplitudeRatio: number, notchPromience: number): number {
    // Ideal ranges based on physiological norms
    const idealAmplitudeRatio = { min: 0.3, max: 0.7 };
    const idealNotchPromience = { min: 0.1, max: 0.3 };

    // Calculate individual confidence scores
    const amplitudeScore = this.calculateRangeScore(
      amplitudeRatio,
      idealAmplitudeRatio.min,
      idealAmplitudeRatio.max
    );

    const notchScore = this.calculateRangeScore(
      notchPromience,
      idealNotchPromience.min,
      idealNotchPromience.max
    );

    // Combine scores with weights
    return (amplitudeScore * 0.6 + notchScore * 0.4);
  }

  private calculateRangeScore(value: number, min: number, max: number): number {
    if (value < min) return Math.max(0, 1 - (min - value) / min);
    if (value > max) return Math.max(0, 1 - (value - max) / max);
    return 1;
  }

  getLastValidPTT(): number {
    return this.lastValidPTT;
  }
}
