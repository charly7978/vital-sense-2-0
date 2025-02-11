
import * as tf from "@tensorflow/tfjs";

export class MLModel {
  private model: tf.Sequential;
  private isTrained: boolean = false;

  constructor() {
    this.model = tf.sequential();
    this.model.add(tf.layers.dense({ inputShape: [3], units: 8, activation: "relu" }));
    this.model.add(tf.layers.dense({ units: 5, activation: "relu" }));
    this.model.add(tf.layers.dense({ units: 3, activation: "linear" }));

    this.model.compile({ 
      optimizer: "adam", 
      loss: "meanSquaredError" 
    });
  }

  async trainModel(trainingData: number[][], targetData: number[][]) {
    if (trainingData.length < 10) {
      console.log("⚠ Datos insuficientes para entrenar");
      return;
    }

    try {
      const xs = tf.tensor2d(trainingData);
      const ys = tf.tensor2d(targetData);

      await this.model.fit(xs, ys, { 
        epochs: 50,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch}: loss = ${logs?.loss}`);
          }
        }
      });
      
      this.isTrained = true;
      console.log("✔ Modelo ML entrenado correctamente");
    } catch (error) {
      console.error("Error entrenando modelo:", error);
    }
  }

  async predictOptimizedSettings(inputData: number[]): Promise<number[]> {
    if (!this.isTrained) {
      console.log("⚠ Modelo ML no entrenado. Usando valores por defecto");
      return [25, 0.5, 0.35];
    }

    try {
      const inputTensor = tf.tensor2d([inputData]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const result = Array.from(await prediction.data());
      
      // Limpieza de memoria
      inputTensor.dispose();
      prediction.dispose();
      
      return result;
    } catch (error) {
      console.error("Error en predicción:", error);
      return [25, 0.5, 0.35];
    }
  }
}
