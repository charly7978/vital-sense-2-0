
export class SignalQualityAnalyzer {
  private readonly minRedThreshold = 150;
  private readonly maxRedValue = 255;
  private readonly minRedGreenRatio = 2.0;
  private readonly minValidPixels = 3000;

  analyzeSignalQuality(signal: number[]): number {
    // Solo analizamos el último valor para máxima velocidad
    if (signal.length === 0) return 0;
    const currentValue = signal[signal.length - 1];
    
    // Validación simple de rango
    if (currentValue < 0 || currentValue > 5) return 0;
    
    return Math.min(Math.max(currentValue / 2, 0), 1);
  }

  calculateSignalStability(redSignal: number[], greenValue: number, blueValue: number, validPixels: number): number {
    if (redSignal.length === 0) return 0;
    
    // Obtener el último valor de rojo
    const redValue = redSignal[redSignal.length - 1];
    
    // 1. Intensidad del rojo
    const redIntensity = Math.min(redValue / this.maxRedValue, 1);
    if (redValue < this.minRedThreshold) return 0;
    
    // 2. Ratio rojo/verde (dominancia del rojo)
    const redGreenRatio = redValue / (greenValue + 1);
    const ratioScore = redGreenRatio >= this.minRedGreenRatio ? 1 : redGreenRatio / this.minRedGreenRatio;
    
    // 3. Cobertura de píxeles válidos
    const coverageScore = Math.min(validPixels / this.minValidPixels, 1);
    
    // Combinar métricas con pesos
    const stability = (
      redIntensity * 0.4 +
      ratioScore * 0.4 +
      coverageScore * 0.2
    );
    
    console.log('Análisis en tiempo real:', {
      redValue: Math.round(redValue),
      redGreenRatio: Math.round(redGreenRatio * 100) / 100,
      validPixels,
      stability: Math.round(stability * 100) / 100
    });

    return Math.min(Math.max(stability, 0), 1);
  }
}
