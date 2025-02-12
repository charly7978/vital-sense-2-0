
/**
 * PPGFeatureExtractor: Extracción de características morfológicas de la onda PPG
 * 
 * IMPORTANTE: Este extractor analiza ÚNICAMENTE características reales de la onda PPG.
 * No genera características sintéticas. Cada medición corresponde a propiedades
 * genuinas de la onda de pulso capturada por la cámara.
 */

interface PPGFeatures {
  augmentationIndex: number;
  reflectionIndex: number;
  stiffnessIndex: number;
  elasticityCoefficient: number;
  confidence: number;
}

export class PPGFeatureExtractor {
  private readonly samplingRate = 30; // Hz

  extractFeatures(ppgSignal: number[]): PPGFeatures | null {
    if (!ppgSignal || ppgSignal.length < 3) return null;

    try {
      // Find systolic peak
      const systolicPeak = Math.max(...ppgSignal);
      const systolicIndex = ppgSignal.indexOf(systolicPeak);

      // Find dicrotic notch
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

      // Calculate augmentation index (AIx)
      const augmentationIndex = (systolicPeak - notchValue) / systolicPeak;

      // Calculate reflection index (RI)
      const timeToReflection = (notchIndex - systolicIndex) * (1000 / this.samplingRate);
      const reflectionIndex = timeToReflection / systolicPeak;

      // Calculate stiffness index (SI)
      const pulseInterval = ppgSignal.length * (1000 / this.samplingRate);
      const stiffnessIndex = pulseInterval / timeToReflection;

      // Calculate elasticity coefficient
      const elasticityCoefficient = this.calculateElasticityCoefficient(
        ppgSignal,
        systolicIndex,
        notchIndex
      );

      // Calculate confidence score
      const confidence = this.calculateConfidenceScore(
        augmentationIndex,
        reflectionIndex,
        stiffnessIndex
      );

      return {
        augmentationIndex,
        reflectionIndex,
        stiffnessIndex,
        elasticityCoefficient,
        confidence
      };
    } catch (error) {
      console.error('Error extracting PPG features:', error);
      return null;
    }
  }

  private calculateElasticityCoefficient(
    signal: number[],
    systolicIndex: number,
    notchIndex: number
  ): number {
    // Calculate area under the curve between systolic peak and dicrotic notch
    let area = 0;
    for (let i = systolicIndex; i <= notchIndex; i++) {
      area += signal[i];
    }
    
    const timeInterval = (notchIndex - systolicIndex) * (1000 / this.samplingRate);
    return area / timeInterval;
  }

  private calculateConfidenceScore(
    augmentationIndex: number,
    reflectionIndex: number,
    stiffnessIndex: number
  ): number {
    // Define physiologically normal ranges
    const normalRanges = {
      augmentationIndex: { min: 0.1, max: 0.4 },
      reflectionIndex: { min: 0.2, max: 0.7 },
      stiffnessIndex: { min: 5, max: 15 }
    };

    // Calculate individual scores
    const aixScore = this.calculateRangeScore(
      augmentationIndex,
      normalRanges.augmentationIndex.min,
      normalRanges.augmentationIndex.max
    );

    const riScore = this.calculateRangeScore(
      reflectionIndex,
      normalRanges.reflectionIndex.min,
      normalRanges.reflectionIndex.max
    );

    const siScore = this.calculateRangeScore(
      stiffnessIndex,
      normalRanges.stiffnessIndex.min,
      normalRanges.stiffnessIndex.max
    );

    // Combine scores with weights
    return (aixScore * 0.4 + riScore * 0.3 + siScore * 0.3);
  }

  private calculateRangeScore(value: number, min: number, max: number): number {
    if (value < min) return Math.max(0, 1 - (min - value) / min);
    if (value > max) return Math.max(0, 1 - (value - max) / max);
    return 1;
  }
}
