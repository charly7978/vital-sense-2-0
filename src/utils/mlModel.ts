
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
    // Capa de entrada con regularización L2
    this.model.add(tf.layers.dense({ 
      inputShape: [3], 
      units: this.modelConfig.inputUnits, 
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: this.modelConfig.l2Regularization })
    }));

    // Capa de dropout para prevenir overfitting
    this.model.add(tf.layers.dropout({ rate: this.modelConfig.dropoutRate }));

    // Capa oculta con regularización L2
    this.model.add(tf.layers.dense({ 
      units: this.modelConfig.hiddenUnits, 
      activation: "relu",
      kernelRegularizer: tf.regularizers.l2({ l2: this.modelConfig.l2Regularization })
    }));

    // Capa de salida
    this.model.add(tf.layers.dense({ 
      units: 3, 
      activation: "linear" 
    }));

    // Compilación del modelo con Adam optimizer y métricas
    this.model.compile({ 
      optimizer: tf.train.adam(this.modelConfig.learningRate),
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
      const newData: TrainingData[] = trainingData.map((input, index) => ({
        input,
        output: targetData[index]
      }));

      this.memoryBuffer.push(...newData);

      // Mantener el tamaño del buffer
      if (this.memoryBuffer.length > this.maxMemoryEntries) {
        this.memoryBuffer = this.memoryBuffer.slice(-this.maxMemoryEntries);
      }

      // Preparar datos para el entrenamiento con shuffle manual
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

      const xs = tf.tensor2d(inputData);
      const ys = tf.tensor2d(outputData);

      // Entrenar el modelo con early stopping
      const history = await this.model.fit(xs, ys, { 
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

      // Limpieza de memoria
      xs.dispose();
      ys.dispose();

    } catch (error) {
      console.error("Error entrenando modelo:", error);
      this.handleModelError(error);
    }
  }

  private handleModelError(error: any) {
    console.error("Detalles del error:", {
      message: error.message,
      stack: error.stack,
      modelState: this.isTrained ? "Entrenado" : "No entrenado",
      memoryBufferSize: this.memoryBuffer.length
    });
  }

  async predictOptimizedSettings(inputData: number[]): Promise<number[]> {
    if (!this.isTrained) {
      console.log("⚠ Modelo ML no entrenado. Usando valores por defecto");
      return this.defaultValues;
    }

    try {
      const inputTensor = tf.tensor2d([inputData]);
      const prediction = this.model.predict(inputTensor) as tf.Tensor;
      const result = Array.from(await prediction.data());
      
      // Limpieza de memoria
      inputTensor.dispose();
      prediction.dispose();
      
      // Validación y ajuste de resultados con límites definidos
      const clampedResult = [
        Math.max(10, Math.min(30, result[0])),    // MIN_RED_VALUE
        Math.max(0.3, Math.min(0.7, result[1])),  // PEAK_THRESHOLD_FACTOR
        Math.max(0.1, Math.min(0.5, result[2]))   // MIN_VALID_PIXELS_RATIO
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
    console.log("Memoria del modelo limpiada");
  }

  getModelStats(): object {
    return {
      isTrained: this.isTrained,
      memoryBufferSize: this.memoryBuffer.length,
      modelConfig: this.modelConfig,
      defaultValues: this.defaultValues
    };
  }
}
