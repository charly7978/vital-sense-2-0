
import * as tf from "@tensorflow/tfjs";

export class MLPredictor {
  async predict(model: tf.Sequential, inputData: number[]): Promise<number[]> {
    const inputTensor = tf.tensor2d([inputData]);
    await tf.engine().startScope();
    
    try {
      const prediction = model.predict(inputTensor) as tf.Tensor;
      const result = Array.from(await prediction.data());
      
      prediction.dispose();
      return result;
    } finally {
      inputTensor.dispose();
      await tf.engine().endScope();
    }
  }

  calculateConfidence(original: number[], clamped: number[]): number {
    const confidenceScores = original.map((val, idx) => {
      const min = idx === 0 ? 10 : idx === 1 ? 0.3 : 0.1;
      const max = idx === 0 ? 30 : idx === 1 ? 0.7 : 0.5;
      const range = max - min;
      const distance = Math.abs(val - clamped[idx]);
      return 1 - (distance / range);
    });

    return confidenceScores.reduce((acc, val) => acc + val, 0) / confidenceScores.length;
  }

  clampPrediction(result: number[]): number[] {
    return [
      Math.max(10, Math.min(30, result[0])),
      Math.max(0.3, Math.min(0.7, result[1])),
      Math.max(0.1, Math.min(0.5, result[2]))
    ];
  }
}
