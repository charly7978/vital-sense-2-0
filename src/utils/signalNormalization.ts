
export class SignalNormalizer {
  private baseline = 0;

  normalizeSignal(value: number): number {
    this.baseline = this.baseline * 0.95 + value * 0.05;
    const normalized = value - this.baseline;
    
    const scale = 100;
    return normalized * scale / Math.max(Math.abs(this.baseline), 1);
  }
}
