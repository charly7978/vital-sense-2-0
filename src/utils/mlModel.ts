
import * as tf from "@tensorflow/tfjs";

interface TrainingData {
  input: number[];
  output: number[];
}

export class MLModel {
  private model: tf.Sequential;
  private isTrained: boolean = false;
  private readonly maxMemoryEntries = 1000;
  private memoryBuffer: TrainingData[] = [];
  private readonly defaultValues = [25, 0.5, 0.35];
  private currentTraining: Promise<void> | null = null;
  private readonly modelConfig = {
    inputUnits: 16,
    hiddenUnits: 8,
    learningRate: 0.001,
    dropoutRate: 0.2,
    l2Regularization: 0.01
  };

  constructor() {
    this.model = tf.sequential();
    this.initializeModel();
  }

  private initializeModel() {
    this.model.add(tf.layers.dense({ 
      inputShape: [3], 
      units: this.modelConfig.inputUnits, 
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: this.modelConfig.l2Regularization })
    }));

    this.model.add(tf.layers.dropout({ rate: this.modelConfig.dropoutRate }));

    this.model.add(tf.layers.dense({ 
      units: this.modelConfig.hiddenUnits, 
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: this.modelConfig.l2Regularization })
    }));

    this.model.add(tf.layers.dense({ 
      units: 3, 
      activation: "linear" 
    }));

    this.model.compile({ 
      optimizer: tf.train.adam(this.modelConfig.learningRate),
      loss: "meanSquaredError",
      metrics: ["mse"]
    });
  }

  private async executeTraining(trainingData: number[][], targetData: number[][]): Promise<void> {
    const newData: TrainingData[] = trainingData.map((input, index) => ({
      input,
      output: targetData[index]
    }));

    this.memoryBuffer.push(...newData);

    if (this.memoryBuffer.length > this.maxMemoryEntries) {
      this.memoryBuffer = this.memoryBuffer.slice(-this.maxMemoryEntries);
    }

    const shuffleArray = <T>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };

    const shuffledData = shuffleArray(this.memoryBuffer);
    const inputData = shuffledData.map(d => d.input);
    const outputData = shuffledData.map(d => d.output);

    let tensors: { xs: tf.Tensor2D; ys: tf.Tensor2D } | null = null;

    try {
      tensors = {
        xs: tf.tensor2d(inputData),
        ys: tf.tensor2d(outputData)
      };

      await tf.engine().startScope();
      const history = await this.model.fit(tensors.xs, tensors.ys, { 
        epochs: 50,
        batchSize: 32,
        validationSplit: 0.2,
        shuffle: true,
        callbacks: {
          onEpochEnd: (epoch, logs) => {
            if (logs) {
              console.log(
                `Epoch ${epoch + 1}: loss = ${logs.loss.toFixed(4)}, ` +
                `val_loss = ${logs.val_loss.toFixed(4)}, ` +
                `mse = ${logs.mse.toFixed(4)}`
              );
            }
          }
        }
      });
      
      this.isTrained = true;
      console.log("✔ Modelo ML entrenado correctamente", {
        finalLoss: history.history.loss[history.history.loss.length - 1],
        finalValLoss: history.history.val_loss[history.history.val_loss.length - 1],
        finalMSE: history.history.mse[history.history.mse.length - 1]
      });

    } finally {
      if (tensors) {
        tensors.xs.dispose();
        tensors.ys.dispose();
      }
      await tf.engine().endScope();
    }
  }

  async trainModel(trainingData: number[][], targetData: number[][]): Promise<void> {
    if (trainingData.length < 10) {
      console.log("⚠ Datos insuficientes para entrenar");
      return;
    }

    try {
      // Si hay un entrenamiento en curso, esperamos a que termine
      if (this.currentTraining) {
        console.log("⚠ Esperando a que termine el entrenamiento anterior...");
        await this.currentTraining;
      }

      console.log("✓ Iniciando nuevo entrenamiento del modelo");
      this.currentTraining = this.executeTraining(trainingData, targetData);
      await this.currentTraining;

    } catch (error) {
      console.error("Error entrenando modelo:", error);
      this.handleModelError(error);
    } finally {
      this.currentTraining = null;
    }
  }

  private handleModelError(error: any) {
    console.error("Detalles del error:", {
      message: error.message,
      stack: error.stack,
      modelState: this.isTrained ? "Entrenado" : "No entrenado",
      memoryBufferSize: this.memoryBuffer.length,
      isTraining: this.currentTraining !== null
    });
  }

  async predictOptimizedSettings(inputData: number[]): Promise<number[]> {
    if (!this.isTrained) {
      console.log("⚠ Modelo ML no entrenado. Usando valores por defecto");
      return this.defaultValues;
    }

    try {
      const inputTensor = tf.tensor2d([inputData]);
      await tf.engine().startScope();
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const result = Array.from(await prediction.data());
      
      inputTensor.dispose();
      prediction.dispose();
      await tf.engine().endScope();
      
      const clampedResult = [
        Math.max(10, Math.min(30, result[0])),
        Math.max(0.3, Math.min(0.7, result[1])),
        Math.max(0.1, Math.min(0.5, result[2]))
      ];

      console.log("Predicción ML:", {
        entrada: inputData,
        original: result,
        ajustada: clampedResult,
        confianza: this.calculateConfidence(result, clampedResult)
      });
      
      return clampedResult;
    } catch (error) {
      console.error("Error en predicción:", error);
      this.handleModelError(error);
      return this.defaultValues;
    }
  }

  private calculateConfidence(original: number[], clamped: number[]): number {
    const confidenceScores = original.map((val, idx) => {
      const min = idx === 0 ? 10 : idx === 1 ? 0.3 : 0.1;
      const max = idx === 0 ? 30 : idx === 1 ? 0.7 : 0.5;
      const range = max - min;
      const distance = Math.abs(val - clamped[idx]);
      return 1 - (distance / range);
    });

    return confidenceScores.reduce((acc, val) => acc + val, 0) / confidenceScores.length;
  }

  clearMemory() {
    this.memoryBuffer = [];
    this.isTrained = false;
    this.currentTraining = null;
    console.log("Memoria del modelo limpiada");
  }

  getModelStats(): object {
    return {
      isTrained: this.isTrained,
      isTraining: this.currentTraining !== null,
      memoryBufferSize: this.memoryBuffer.length,
      modelConfig: this.modelConfig,
      defaultValues: this.defaultValues
    };
  }
}
