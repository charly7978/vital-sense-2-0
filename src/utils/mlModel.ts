
import * as tf from "@tensorflow/tfjs";

export class MLModel {
  private model: tf.Sequential;
  private isTrained: boolean = false;
  private readonly maxMemoryEntries = 1000;
  private memoryBuffer: Array<{input: number[], output: number[]}> = [];

  constructor() {
    this.model = tf.sequential();
    this.model.add(tf.layers.dense({ 
      inputShape: [3], 
      units: 16, 
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    this.model.add(tf.layers.dropout({ rate: 0.2 }));
    this.model.add(tf.layers.dense({ 
      units: 8, 
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: 0.01 })
    }));
    this.model.add(tf.layers.dense({ units: 3, activation: "linear" }));

    this.model.compile({ 
      optimizer: tf.train.adam(0.001),
      loss: "meanSquaredError",
      metrics: ["mse"]
    });
  }

  async trainModel(trainingData: number[][], targetData: number[][]) {
    if (trainingData.length < 10) {
      console.log("⚠ Datos insuficientes para entrenar");
      return;
    }

    try {
      // Agregar datos al buffer de memoria
      for (let i = 0; i < trainingData.length; i++) {
        this.memoryBuffer.push({
          input: trainingData[i],
          output: targetData[i]
        });
      }

      // Mantener el tamaño del buffer
      if (this.memoryBuffer.length > this.maxMemoryEntries) {
        this.memoryBuffer = this.memoryBuffer.slice(-this.maxMemoryEntries);
      }

      // Preparar datos para el entrenamiento
      const shuffledData = tf.util.shuffle(this.memoryBuffer);
      const xs = tf.tensor2d(shuffledData.map(d => d.input));
      const ys = tf.tensor2d(shuffledData.map(d => d.output));

      // Entrenar el modelo
      const history = await this.model.fit(xs, ys, { 
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            console.log(`Epoch ${epoch + 1}: loss = ${logs?.loss.toFixed(4)}, val_loss = ${logs?.val_loss.toFixed(4)}`);
          }
        }
      });
      
      this.isTrained = true;
      console.log("✔ Modelo ML entrenado correctamente", {
        finalLoss: history.history.loss[history.history.loss.length - 1],
        finalValLoss: history.history.val_loss[history.history.val_loss.length - 1]
      });

      // Limpieza de memoria
      xs.dispose();
      ys.dispose();
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
      
      // Validación y ajuste de resultados
      const clampedResult = [
        Math.max(10, Math.min(30, result[0])),  // MIN_RED_VALUE
        Math.max(0.3, Math.min(0.7, result[1])), // PEAK_THRESHOLD_FACTOR
        Math.max(0.1, Math.min(0.5, result[2]))  // MIN_VALID_PIXELS_RATIO
      ];

      console.log("Predicción ML:", {
        original: result,
        ajustada: clampedResult
      });
      
      return clampedResult;
    } catch (error) {
      console.error("Error en predicción:", error);
      return [25, 0.5, 0.35];
    }
  }

  clearMemory() {
    this.memoryBuffer = [];
    this.isTrained = false;
    console.log("Memoria del modelo limpiada");
  }
}
